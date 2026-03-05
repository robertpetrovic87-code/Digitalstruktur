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

  // Wir ack'en alles, interessieren uns aber nur für completed
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const reportId = session.metadata?.reportId;

  if (!reportId) {
    return new NextResponse("Missing reportId in session metadata", { status: 400 });
  }

  const supabase = supabaseAdmin();

  // Optional: Email aus Stripe (falls reports.email leer ist oder du überschreiben willst)
  const stripeEmail = session.customer_details?.email ?? null;

  // ✅ Payment markieren (schnell, stabil, idempotent)
  const { error } = await supabase
    .from("reports")
    .update({
      purchased_blueprint: true,
      stripe_session_id: session.id,
      paid_at: new Date().toISOString(),
      status: "blueprint_purchased", // <— einheitlich
      ...(stripeEmail ? { email: stripeEmail } : {}), // nur setzen wenn vorhanden
    })
    .eq("id", reportId);

  if (error) {
    return new NextResponse(`Supabase update failed: ${error.message}`, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}