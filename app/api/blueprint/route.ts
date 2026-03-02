// app/api/blueprint/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const rid = req.nextUrl.searchParams.get("rid");
  if (!rid) return new Response("Missing rid", { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("reports")
    .select("purchased_blueprint, blueprint_json, blueprint_created_at, url, goal")
    .eq("id", rid)
    .single();

  if (error || !data) return new Response("Not found", { status: 404 });
  if (!data.purchased_blueprint) return new Response("Not purchased", { status: 403 });
  if (!data.blueprint_json) return new Response("Blueprint not ready", { status: 202 });

  return Response.json({
    blueprint: data.blueprint_json,
    meta: { url: data.url, goal: data.goal, created_at: data.blueprint_created_at },
  });
}