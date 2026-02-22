// app/api/request-report/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { supabase } from "app/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function sign(data: string) {
  const secret = process.env.TOKEN_SECRET!;
  return base64url(crypto.createHmac("sha256", secret).update(data).digest());
}

export async function POST(req: Request) {
  try {
    const { email, website, goal, result } = await req.json();

    if (!email || !website || !goal || !result) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1️⃣ Report speichern
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          email,
          url: website,
          goal,
          result_json: result,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reportId = data.id;

    // 2️⃣ Token nur mit report_id
    const exp = Date.now() + 1000 * 60 * 60;
    const payloadObj = { reportId, exp };
    const payload = base64url(JSON.stringify(payloadObj));
    const sig = sign(payload);
    const token = `${payload}.${sig}`;

    const confirmUrl = `${process.env.APP_URL}/confirm?token=${encodeURIComponent(token)}`;

    // 3️⃣ Confirmation Mail
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}