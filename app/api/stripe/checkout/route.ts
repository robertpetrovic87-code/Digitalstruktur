import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { reportId } = await req.json();

    if (!reportId || typeof reportId !== "string") {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
    }

    const appUrl = process.env.APP_URL!;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
       line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: 19900,
            product_data: {
              name: "AI Website Blueprint (30 Tage)",
              description:
                "Individueller 30-Tage Umsetzungsplan für deine Website (Struktur, Texte, CTA, SEO).",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/blueprint/success?session_id={CHECKOUT_SESSION_ID}&rid=${encodeURIComponent(reportId)}`,
      cancel_url: `${appUrl}/blueprint?rid=${encodeURIComponent(reportId)}&canceled=1`,
      metadata: { reportId },
       });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Stripe checkout failed" }, { status: 500 });
  }
}