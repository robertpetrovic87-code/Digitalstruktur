// app/api/report/route.ts
import { NextResponse } from "next/server";
import { supabase } from "app/lib/supabase";

export async function POST(req: Request) {
  try {
    const { reportId } = await req.json();
    if (!reportId || typeof reportId !== "string") {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
    }

    const { data: report, error } = await supabase
      .from("reports")
      .select("id,url,goal,result_json,status,created_at")
      .eq("id", reportId)
      .single();

    if (error || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, report });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}