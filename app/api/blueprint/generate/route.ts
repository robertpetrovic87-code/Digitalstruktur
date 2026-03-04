// app/api/blueprint/generate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateBlueprintFromResult } from "@/app/lib/blueprint/blueprint.generator";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

const supabaseAdmin = createClient(
  mustEnv("SUPABASE_URL"),
  mustEnv("SUPABASE_SERVICE_ROLE_KEY")
);

type ReportRow = {
  id: string;
  url: string | null;
  goal: string | null;
  result_json: unknown | null;
  purchased_blueprint: boolean;
  blueprint_created_at: string | null;
  blueprint_json: unknown | null;
  status: string | null;
};

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
}

export async function POST(req: NextRequest) {
  let rid: string | null = null;

  try {
    const body = await req.json();
    rid = typeof body?.rid === "string" ? body.rid : null;
  } catch {}

  if (!rid) return new NextResponse("Missing rid", { status: 400 });

  // 1️⃣ Report laden
  const { data, error: fetchErr } = await supabaseAdmin
    .from("reports")
    .select(
      "id, url, goal, result_json, purchased_blueprint, blueprint_created_at, blueprint_json, status"
    )
    .eq("id", rid)
    .single();

  const report = data as ReportRow | null;

  if (fetchErr || !report) return new NextResponse("Not found", { status: 404 });
  if (!report.purchased_blueprint) return new NextResponse("Not purchased", { status: 403 });

  // 2️⃣ Wenn Blueprint schon existiert → fertig
  if (report.blueprint_created_at && report.blueprint_json) {
    return NextResponse.json({ ok: true, status: "already_created" });
  }

  // 3️⃣ Wenn result_json fehlt → warten
  if (!report.result_json) {
    await supabaseAdmin
      .from("reports")
      .update({ status: "blueprint_failed_missing_result_json" })
      .eq("id", rid);

    return new NextResponse("Missing result_json", { status: 202 });
  }

  // 4️⃣ Prüfen ob schon ein Run läuft (Timeout Schutz)
  const status = report.status ?? "";

  if (status.startsWith("blueprint_creating_")) {
    const ts = Number(status.replace("blueprint_creating_", ""));
    if (!Number.isNaN(ts)) {
      const age = Date.now() - ts;
      const fiveMinutes = 5 * 60 * 1000;

      if (age < fiveMinutes) {
        return NextResponse.json(
          { ok: true, status: "creation_in_progress" },
          { status: 202 }
        );
      }

      // alter Run → reset
      await supabaseAdmin
        .from("reports")
        .update({ status: "blueprint_retry_after_timeout" })
        .eq("id", rid);
    }
  }

  // 5️⃣ Jetzt wirklich starten
  await supabaseAdmin
    .from("reports")
    .update({ status: `blueprint_creating_${Date.now()}` })
    .eq("id", rid);

  try {
    // 6️⃣ AI Blueprint generieren
    const blueprint = await generateBlueprintFromResult({
      reportId: rid,
      language: "de",
      resultJson: report.result_json,
      url: report.url ?? undefined,
      goal: report.goal ?? undefined,
    });

    // 7️⃣ Speichern
    const { error: saveErr } = await supabaseAdmin
      .from("reports")
      .update({
        blueprint_json: blueprint,
        blueprint_created_at: new Date().toISOString(),
        status: "blueprint_created",
      })
      .eq("id", rid);

    if (saveErr)
      return new NextResponse(`Save failed: ${saveErr.message}`, { status: 500 });

    return NextResponse.json({ ok: true, status: "created" });
  } catch (e: unknown) {
    const msg = errMsg(e);

    await supabaseAdmin
      .from("reports")
      .update({
        status: `blueprint_failed: ${msg}`.slice(0, 240),
      })
      .eq("id", rid);

    return new NextResponse(`Blueprint generation failed: ${msg}`, { status: 500 });
  }
}