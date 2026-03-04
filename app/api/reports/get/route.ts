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

const supabaseAdmin = createClient(
  mustEnv("SUPABASE_URL"),
  mustEnv("SUPABASE_SERVICE_ROLE_KEY")
);

export async function GET(req: NextRequest) {
  const rid = req.nextUrl.searchParams.get("rid");
  if (!rid) return new NextResponse("Missing rid", { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("id, purchased_blueprint, blueprint_created_at, blueprint_json")
    .eq("id", rid)
    .single();

  if (error || !data) return new NextResponse("Not found", { status: 404 });

  return NextResponse.json(data);
}