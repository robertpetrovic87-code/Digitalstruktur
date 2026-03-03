// app/api/blueprint/generate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateBlueprintFromResult } from "@/app/lib/blueprint/blueprint.generator";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

const supabaseAdmin = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"));

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
}

export async function POST(req: NextRequest) {
  let rid: string | null = null;

  try {
    const body = await req.json();
    rid = typeof body?.rid === "string" ? body.rid : null;
  } catch {
    // ignore
  }

  if (!rid) return new NextResponse("Missing rid", { status: 400 });

  const { data: report, error } = await supabaseAdmin
    .from("reports")
    .select("id, url, goal, result_json, purchased_blueprint, blueprint_created_at")
    .eq("id", rid)
    .single();

  if (error || !report) return new NextResponse("Not found", { status: 404 });
  if (!report.purchased_blueprint) return new NextResponse("Not purchased", { status: 403 });

  // Idempotent: wenn schon existiert, fertig
  if (report.blueprint_created_at) {
    return NextResponse.json({ ok: true, status: "already_created" });
  }

  if (report.result_json == null) {
    await supabaseAdmin.from("reports").update({ status: "blueprint_failed_missing_result_json" }).eq("id", rid);
    return new NextResponse("Missing result_json", { status: 400 });
  }

  // Optional status
  await supabaseAdmin.from("reports").update({ status: "blueprint_creating" }).eq("id", rid);

  try {
    const blueprint = await generateBlueprintFromResult({
      reportId: rid,
      language: "de",
      resultJson: report.result_json,
      url: report.url ?? undefined,
      goal: report.goal ?? undefined,
    });

    const { error: saveErr } = await supabaseAdmin
      .from("reports")
      .update({
        blueprint_json: blueprint,
        blueprint_created_at: new Date().toISOString(),
        status: "blueprint_created",
      })
      .eq("id", rid);

    if (saveErr) return new NextResponse(`Save failed: ${saveErr.message}`, { status: 500 });

    return NextResponse.json({ ok: true, status: "created" });
  } catch (e: unknown) {
    const msg = errMsg(e);
    await supabaseAdmin
      .from("reports")
      .update({ status: `blueprint_failed: ${msg}`.slice(0, 240) })
      .eq("id", rid);

    return new NextResponse(`Blueprint generation failed: ${msg}`, { status: 500 });
  }
}