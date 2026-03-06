// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"));

function supabaseAdmin() {
  return createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
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
    console.error("❌ Invalid Stripe signature:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  console.log("✅ Stripe event received:", event.type);

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const reportId = session.metadata?.reportId;
  const stripeEmail = session.customer_details?.email ?? null;

  console.log("🧾 Session ID:", session.id);
  console.log("🧾 Report ID from metadata:", reportId);
  console.log("🧾 Payment status:", session.payment_status);
  console.log("🧾 Amount total:", session.amount_total);

  if (!reportId) {
    console.error("❌ Missing reportId in session metadata");
    return new NextResponse("Missing reportId in session metadata", {
      status: 400,
    });
  }

  const supabase = supabaseAdmin();

  // 1) prüfen ob Report überhaupt existiert
  const { data: existingReport, error: fetchError } = await supabase
    .from("reports")
    .select("id, purchased_blueprint, status, email")
    .eq("id", reportId)
    .maybeSingle();

  if (fetchError) {
    console.error("❌ Supabase fetch failed:", fetchError);
    return new NextResponse(`Supabase fetch failed: ${fetchError.message}`, {
      status: 500,
    });
  }

  if (!existingReport) {
    console.error("❌ No report found for id:", reportId);
    return new NextResponse(`No report found for id: ${reportId}`, {
      status: 404,
    });
  }

  console.log("📄 Existing report found:", existingReport);

  // 2) update durchführen und Ergebnis zurückgeben
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
    .select("id, purchased_blueprint, status, stripe_session_id, paid_at, email");

  if (updateError) {
    console.error("❌ Supabase update failed:", updateError);
    return new NextResponse(`Supabase update failed: ${updateError.message}`, {
      status: 500,
    });
  }

  if (!updatedRows || updatedRows.length === 0) {
    console.error("❌ Update matched 0 rows for reportId:", reportId);
    return new NextResponse(`Update matched 0 rows for reportId: ${reportId}`, {
      status: 404,
    });
  }

  console.log("✅ Supabase updated successfully:", updatedRows[0]);

  return NextResponse.json({
    ok: true,
    reportId,
    updated: updatedRows[0],
  });
}