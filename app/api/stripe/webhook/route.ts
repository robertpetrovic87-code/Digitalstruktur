import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "app/lib/supabase";
import { Resend } from "resend";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

/* ---------------- Types ---------------- */

type BlueprintPayload = {
  overallScore?: number;
  strengths?: string[];
  blockers?: string[];
  quickWins?: { title: string; how: string }[];
  detailedReport?: Record<string, string>;
  summary?: string;
};

type ReportRow = {
  id: string;
  email: string;
  url: string;
  goal: string;
  result_json: BlueprintPayload;
  purchased_blueprint: boolean | null;
  blueprint_json: unknown;
};

/* ---------------- OpenAI Generator ---------------- */

async function generateBlueprintWithOpenAI(
  payload: BlueprintPayload
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const prompt = `
Du bist ein Senior Conversion & SEO Consultant.

Erstelle einen klar strukturierten 30-Tage Umsetzungsplan.

Struktur:
Woche 1: Messaging + Hero + CTA
Woche 2: Struktur + Trust + Conversion Path
Woche 3: SEO + Seitenplan
Woche 4: Feinschliff + Optimierung + Tracking

Sprache: Deutsch
Konkret, keine Floskeln.
Mit Prioritäten & Reihenfolge.

Input:
${JSON.stringify(payload).slice(0, 12000)}
`.trim();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof json?.error?.message === "string"
        ? json.error.message
        : "OpenAI error"
    );
  }

  let outputText: string | null = null;

    if (typeof json.output_text === "string") {
  outputText = json.output_text;
} else if (Array.isArray(json.output)) {
  const first = json.output[0];

  if (
    first &&
    Array.isArray(first.content)
  ) {
    const match = first.content.find(
      (c: { type?: string; text?: string }) =>
        c.type === "output_text" && typeof c.text === "string"
    );

    if (match && typeof match.text === "string") {
      outputText = match.text;
    }
  }
}

  if (!outputText) throw new Error("No OpenAI output");

  return outputText;
}

/* ---------------- Email Builder ---------------- */

function buildBlueprintEmailHTML(args: {
  website: string;
  goal: string;
  score: number | string;
  blueprint: string;
}): string {
  const { website, goal, score, blueprint } = args;

  return `
  <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:720px;margin:0 auto;padding:20px">
    <h2>✅ Dein 30-Tage AI Blueprint</h2>

    <div style="margin-bottom:15px;color:#444">
      <div><b>Website:</b> ${website}</div>
      <div><b>Ziel:</b> ${goal}</div>
      <div><b>Score:</b> ${String(score)}/100</div>
    </div>

    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:15px;background:#fff">
      <pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.6;margin:0">
${blueprint}
      </pre>
    </div>

    <p style="margin-top:20px;font-size:12px;color:#666">
      Wenn du möchtest, kann ich einzelne Schritte auch direkt für dich umsetzen.
    </p>
  </div>
  `;
}

/* ---------------- Webhook Handler ---------------- */

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object;

  if (!("metadata" in session)) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const reportId = session.metadata?.reportId;

  if (typeof reportId !== "string") {
    return NextResponse.json(
      { error: "Invalid or missing reportId" },
      { status: 400 }
    );
  }

  /* -------- Load report -------- */

  const { data: report, error } = await supabase
    .from("reports")
    .select(
      "id,email,url,goal,result_json,purchased_blueprint,blueprint_json"
    )
    .eq("id", reportId)
    .single<ReportRow>();

  if (error || !report) {
    return NextResponse.json(
      { error: "Report not found" },
      { status: 404 }
    );
  }

  // Idempotency
  if (report.purchased_blueprint && report.blueprint_json) {
    return NextResponse.json({ ok: true, alreadyDone: true });
  }

  /* -------- Generate blueprint -------- */

  const blueprintText = await generateBlueprintWithOpenAI(
    report.result_json
  );

  /* -------- Save blueprint -------- */

  await supabase
    .from("reports")
    .update({
      purchased_blueprint: true,
      stripe_session_id: session.id,
      blueprint_json: { text: blueprintText },
      blueprint_created_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  /* -------- Send email -------- */

  const score =
    typeof report.result_json.overallScore === "number"
      ? report.result_json.overallScore
      : "—";

  const html = buildBlueprintEmailHTML({
    website: report.url,
    goal: report.goal,
    score,
    blueprint: blueprintText,
  });

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: report.email,
    subject: "✅ Dein 30-Tage AI Blueprint ist da",
    html,
  });

  return NextResponse.json({ ok: true });
}