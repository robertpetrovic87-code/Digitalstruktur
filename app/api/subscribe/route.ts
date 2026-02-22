import { NextResponse } from "next/server";

const MAILERLITE_API = "https://connect.mailerlite.com/api";

type SubscribeRequest = {
  email: string;
  websiteUrl: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SubscribeRequest;
    const { email, websiteUrl } = body;
    console.log("👉 BODY:", body);

    // 1) Validation
    if (!email || !websiteUrl) {
      return NextResponse.json(
        { error: "Missing email or websiteUrl" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 422 }
      );
      console.log("👉 SUBSCRIBE ROUTE HIT");
    }

    const apiKey = process.env.MAILERLITE_API_KEY;
    const groupId = process.env.MAILERLITE_GROUP_ID;

    if (!apiKey || !groupId) {
      return NextResponse.json(
        { error: "Server misconfigured (env vars missing)" },
        { status: 500 }
      );
    }

    // 2) Call MailerLite
    const response = await fetch(`${MAILERLITE_API}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        fields: {
          website_url: websiteUrl,
        },
        groups: [groupId],
      }),
    });

    const rawText = await response.text();
    const parsedBody: unknown = isJson(rawText)
      ? JSON.parse(rawText)
      : rawText;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "MailerLite error",
          details: parsedBody,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      { error: "Unexpected error", details: message },
      { status: 500 }
    );
  }
}