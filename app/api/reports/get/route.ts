// app/api/reports/get/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

const supabaseAdmin = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"));

export async function GET(req: NextRequest) {
  const rid = req.nextUrl.searchParams.get("rid");
  if (!rid) return NextResponse.json({ error: "Missing rid" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("id, purchased_blueprint, status, paid_at, email, url, goal")
    .eq("id", rid)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: data.id,
    purchased_blueprint: data.purchased_blueprint,
    status: data.status,
    paid_at: data.paid_at,
    email: data.email,
    url: data.url,
    goal: data.goal,
  });
}