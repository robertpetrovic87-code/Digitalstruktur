export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ nur das hier brauchst du:
import { generateBlueprintFromResult } from "@/app/lib/blueprint/blueprint.generator";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

// ✅ Lass apiVersion weg (weil du damit vorher Typ-Probleme hattest)
const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"));

function supabaseAdmin() {
  return createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, mustEnv("STRIPE_WEBHOOK_SECRET"));
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const reportId = session.metadata?.reportId;

  if (!reportId) {
    return new NextResponse("Missing reportId in session metadata", { status: 400 });
  }

  const supabase = supabaseAdmin();

  // ✅ DEIN BESTEHENDER UPDATE (unverändert)
  const { error } = await supabase
    .from("reports")
    .update({
      purchased_blueprint: true,
      stripe_session_id: session.id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return new NextResponse(`Supabase update failed: ${error.message}`, { status: 500 });
  }

  // ✅ Report laden
  const { data: report, error: fetchErr } = await supabase
    .from("reports")
    .select("id, url, goal, result_json, blueprint_created_at")
    .eq("id", reportId)
    .single();

  if (fetchErr || !report) {
    return NextResponse.json({ ok: true, blueprint: "report_not_found_after_payment" });
  }

  // ✅ Idempotency guard (Stripe retries)
  if (report.blueprint_created_at) {
    return NextResponse.json({ ok: true, blueprint: "already_created" });
  }

  if (report.result_json == null) {
    return NextResponse.json({ ok: true, blueprint: "missing_result_json" });
  }

  try {
    const blueprint = await generateBlueprintFromResult({
      reportId,
      language: "de",
      resultJson: report.result_json,
      url: report.url ?? undefined,
      goal: report.goal ?? undefined,
    });

    const { error: saveErr } = await supabase
      .from("reports")
      .update({
        blueprint_json: blueprint,
        blueprint_created_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (saveErr) {
      return new NextResponse(`Blueprint save failed: ${saveErr.message}`, { status: 500 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
    return new NextResponse(`Blueprint generation failed: ${msg}`, { status: 500 });
  }

  return NextResponse.json({ ok: true, blueprint: "created" });
}