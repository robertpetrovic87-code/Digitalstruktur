// app/api/blueprint/pdf/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pdf } from "@react-pdf/renderer";

import { BlueprintSchema } from "@/app/lib/blueprint/blueprint.schema";
import { BlueprintPdfDoc } from "@/app/lib/blueprint/blueprint.pdf";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

const supabaseAdmin = createClient(
  mustEnv("SUPABASE_URL"),
  mustEnv("SUPABASE_SERVICE_ROLE_KEY")
);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as { rid?: unknown }));
  const rid = typeof body.rid === "string" ? body.rid : null;

  if (!rid) return new NextResponse("Missing rid", { status: 400 });

  const { data: report, error } = await supabaseAdmin
    .from("reports")
    .select("id, url, goal, purchased_blueprint, blueprint_json")
    .eq("id", rid)
    .single();

  if (error || !report) return new NextResponse("Not found", { status: 404 });
  if (!report.purchased_blueprint) return new NextResponse("Not purchased", { status: 403 });
  if (!report.blueprint_json) return new NextResponse("Blueprint not ready", { status: 202 });

  const blueprint = BlueprintSchema.parse(report.blueprint_json);

  // ✅ IMPORTANT: no JSX in .ts file
  const docElement = React.createElement(BlueprintPdfDoc, {
  blueprint,
  meta: { url: report.url, goal: report.goal },
}) as unknown as ReactElement<DocumentProps>;

const buffer = await pdf(docElement).toBuffer();

  const bucket = "blueprints";
  const path = `${rid}.pdf`;

  const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (upErr) return new NextResponse(`Upload failed: ${upErr.message}`, { status: 500 });

  const expiresIn = 60 * 60 * 24 * 7; // 7 days

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (signErr || !signed?.signedUrl) {
    return new NextResponse(`Signed URL failed: ${signErr?.message ?? "unknown"}`, {
      status: 500,
    });
  }
  return NextResponse.json({
  ok: true,
  bucket: "blueprints",
  path: `${rid}.pdf`,
  url: signed.signedUrl,
  });
  
}