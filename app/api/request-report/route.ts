import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

type RequestBody = {
  email?: string;
  reportId?: string;
};

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

function sign(data: string) {
  const secret = mustEnv("TOKEN_SECRET");
  return base64url(crypto.createHmac("sha256", secret).update(data).digest());
}

function getSupabaseAdmin() {
  const url = mustEnv("SUPABASE_URL");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim(); // fallback, falls du keinen service role nutzt

  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is missing");
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json().catch(() => null);

    const parsed = body as RequestBody | null;
    const email = parsed?.email?.trim();
    const reportId = parsed?.reportId?.trim();

    if (!email || !reportId) {
      return NextResponse.json(
        { error: "Missing fields", need: ["email", "reportId"] },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1) Report updaten (statt neu insert)
    const { data, error } = await supabase
      .from("reports")
      .update({ email, status: "pending" })
      .eq("id", reportId)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Report not found" },
        { status: 500 }
      );
    }

    // 2) Token erzeugen
    const exp = Date.now() + 1000 * 60 * 60; // 1h
    const payloadObj = { reportId, exp };
    const payload = base64url(JSON.stringify(payloadObj));
    const sig = sign(payload);
    const token = `${payload}.${sig}`;

    const appUrl = mustEnv("APP_URL");
    const confirmUrl = `${appUrl}/confirm?token=${encodeURIComponent(token)}`;

    // 3) Mail senden
    const resend = new Resend(mustEnv("RESEND_API_KEY"));

    await resend.emails.send({
      from: mustEnv("EMAIL_FROM"),
      to: email,
      subject: "Confirm your email to receive your website report",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Confirm your email</h2>
          <p>Please confirm your email to receive your detailed website report.</p>
          <p>
            <a href="${confirmUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px">
              Confirm & get my report
            </a>
          </p>
          <p style="color:#666;font-size:12px">This link expires in 1 hour.</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, reportId });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}