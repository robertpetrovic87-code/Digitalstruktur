// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"));
const resend = new Resend(mustEnv("RESEND_API_KEY"));

function supabaseAdmin() {
  return createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      mustEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (err) {
    console.error("Invalid Stripe signature:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const reportId = session.metadata?.reportId;

  if (!reportId) {
    return new NextResponse("Missing reportId in session metadata", {
      status: 400,
    });
  }

  const supabase = supabaseAdmin();

  const stripeEmail = session.customer_details?.email ?? null;
  const amountTotal = session.amount_total ?? 0;
  const currency = (session.currency ?? "eur").toUpperCase();

  const { data: report, error: reportLoadError } = await supabase
    .from("reports")
    .select("id, email, url, goal, purchased_blueprint, status")
    .eq("id", reportId)
    .maybeSingle();

  if (reportLoadError) {
    console.error("Supabase fetch failed:", reportLoadError);
    return new NextResponse(
      `Supabase fetch failed: ${reportLoadError.message}`,
      { status: 500 }
    );
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("reports")
    .update({
      purchased_blueprint: true,
      stripe_session_id: session.id,
      paid_at: new Date().toISOString(),
      status: "blueprint_purchased",
      ...(stripeEmail ? { email: stripeEmail } : {}),
    })
    .eq("id", reportId)
    .select("id, email, url, goal, purchased_blueprint, status, stripe_session_id, paid_at");

  if (updateError) {
    console.error("Supabase update failed:", updateError);
    return new NextResponse(
      `Supabase update failed: ${updateError.message}`,
      { status: 500 }
    );
  }

  if (!updatedRows || updatedRows.length === 0) {
    console.error("Update matched 0 rows for reportId:", reportId);
    return new NextResponse(`Update matched 0 rows for reportId: ${reportId}`, {
      status: 404,
    });
  }

  const updated = updatedRows[0];
  const customerEmail = updated.email || stripeEmail || "";
  const website = updated.url || report?.url || "—";
  const goal = updated.goal || report?.goal || "—";

  const formattedAmount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(amountTotal / 100);

  // 1) Interne Verkaufs-Mail an dich
  try {
    await resend.emails.send({
      from: mustEnv("EMAIL_FROM"),
      to: mustEnv("SALES_NOTIFY_TO"),
      subject: `🎉 Neuer Blueprint-Verkauf – ${formattedAmount}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:0 auto;padding:20px">
          <h2 style="margin:0 0 16px 0">🎉 Neuer Blueprint-Verkauf</h2>

          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#ffffff">
            <p style="margin:0 0 10px 0;"><b>Betrag:</b> ${escapeHtml(formattedAmount)}</p>
            <p style="margin:0 0 10px 0;"><b>Kunden-E-Mail:</b> ${escapeHtml(customerEmail || "—")}</p>
            <p style="margin:0 0 10px 0;"><b>Website:</b> ${escapeHtml(website)}</p>
            <p style="margin:0 0 10px 0;"><b>Ziel:</b> ${escapeHtml(goal)}</p>
            <p style="margin:0 0 10px 0;"><b>Report ID:</b> ${escapeHtml(updated.id)}</p>
            <p style="margin:0 0 10px 0;"><b>Stripe Session:</b> ${escapeHtml(session.id)}</p>
            <p style="margin:0;"><b>Status:</b> ${escapeHtml(updated.status ?? "blueprint_purchased")}</p>
          </div>

          <div style="margin-top:18px">
            <a
              href="https://www.digitalstruktur.com/blueprint?rid=${encodeURIComponent(updated.id)}"
              style="display:inline-block;padding:12px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700"
            >
              Blueprint öffnen →
            </a>
          </div>
        </div>
      `,
    });
  } catch (mailError) {
    console.error("Sales notification email failed:", mailError);
  }

 // 2) Kunden-Bestätigung nach Kauf
if (customerEmail) {
  try {
    await resend.emails.send({
      from: mustEnv("EMAIL_FROM"),
      to: customerEmail,
      subject: "Dein AI Website Blueprint wird erstellt",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:0 auto;padding:20px">
          <h2 style="margin:0 0 14px 0">Danke für deinen Kauf 🙌</h2>

          <p style="margin:0 0 12px 0;color:#111;">
            dein <b>AI Website Blueprint</b> wurde erfolgreich bestellt.
          </p>

          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#ffffff;margin:16px 0;">
            <p style="margin:0 0 10px 0;"><b>Website:</b> ${escapeHtml(website)}</p>
            <p style="margin:0 0 10px 0;"><b>Ziel:</b> ${escapeHtml(goal)}</p>
            <p style="margin:0;"><b>Preis:</b> ${escapeHtml(formattedAmount)}</p>
          </div>

          <p style="margin:0 0 12px 0;color:#111;">
            Wir erstellen deinen individuellen <b>30 Tage AI Website Blueprint</b> aktuell manuell,
            damit du einen klaren und wirklich brauchbaren Umsetzungsplan bekommst.
          </p>

          <p style="margin:0 0 12px 0;color:#111;">
            Du erhältst innerhalb von <b>24 Stunden</b> eine E-Mail mit:
          </p>

          <ul style="margin:10px 0 16px 18px;color:#111;">
            <li>deinem fertigen <b>AI Website Blueprint (PDF)</b></li>
            <li>der <b>Rechnung</b> zu deiner Bestellung</li>
          </ul>

          <p style="margin:0;color:#111;">
            Du musst aktuell nichts weiter tun.
          </p>

          <p style="margin:16px 0 0 0;color:#555;font-size:14px;">
            Wenn du Fragen hast oder innerhalb von 24 Stunden keine E-Mail erhältst,
            schreibe uns einfach an
            <a href="mailto:support@digitalstruktur.com"> support@digitalstruktur.com</a>.
          </p>
        </div>
      `,
    });
  } catch (customerMailError) {
    console.error("Customer confirmation email failed:", customerMailError);
  }
}

  return NextResponse.json({ ok: true });
}