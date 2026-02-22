// app/api/confirm/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { supabase } from "app/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

function base64urlToString(input: string) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  return Buffer.from(base64, "base64").toString("utf8");
}

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function sign(data: string) {
  const secret = process.env.TOKEN_SECRET!;
  return base64url(crypto.createHmac("sha256", secret).update(data).digest());
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function badgeColor(impact: string) {
  if (impact === "high") return "#dc2626";
  if (impact === "medium") return "#f59e0b";
  return "#16a34a";
}

// ---------- Type helpers (no any) ----------
type JsonObject = Record<string, unknown>;

function isObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumberLike(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

type SeoQuickWin = { title: string; how: string; impact: "high" | "medium" | "low" };

function toSeoQuickWin(v: unknown): SeoQuickWin | null {
  if (!isObject(v)) return null;
  const title = asString(v.title);
  const how = asString(v.how);
  const impactRaw = asString(v.impact, "medium");
  const impact: SeoQuickWin["impact"] =
    impactRaw === "high" || impactRaw === "medium" || impactRaw === "low" ? impactRaw : "medium";
  if (!title || !how) return null;
  return { title, how, impact };
}

type CopyPack = { headlines: string[]; subheadline: string; ctas: string[] };
function toCopyPack(v: unknown): CopyPack | null {
  if (!isObject(v)) return null;
  const headlines = Array.isArray(v.headlines) ? v.headlines.filter((x) => typeof x === "string") as string[] : [];
  const ctas = Array.isArray(v.ctas) ? v.ctas.filter((x) => typeof x === "string") as string[] : [];
  const subheadline = asString(v.subheadline);
  if (!headlines.length && !subheadline && !ctas.length) return null;
  return { headlines, subheadline, ctas };
}

type Snippet = { metaTitle: string; metaDescription: string; primaryKeyword: string; secondaryKeywords: string[] };
function toSnippet(v: unknown): Snippet | null {
  if (!isObject(v)) return null;
  const metaTitle = asString(v.metaTitle);
  const metaDescription = asString(v.metaDescription);
  const primaryKeyword = asString(v.primaryKeyword);
  const secondaryKeywords = Array.isArray(v.secondaryKeywords)
    ? (v.secondaryKeywords.filter((x) => typeof x === "string") as string[])
    : [];
  if (!metaTitle && !metaDescription && !primaryKeyword && !secondaryKeywords.length) return null;
  return { metaTitle, metaDescription, primaryKeyword, secondaryKeywords };
}

type QuickWin = { title: string; how: string };
function toQuickWin(v: unknown): QuickWin | null {
  if (!isObject(v)) return null;
  const title = asString(v.title);
  const how = asString(v.how);
  if (!title || !how) return null;
  return { title, how };
}
// ------------------------------------------

export async function POST(req: Request) {
  try {
    const bodyUnknown: unknown = await req.json();
    if (!isObject(bodyUnknown)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const token = bodyUnknown.token;
    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const [payload, sig] = token.split(".");
    if (!payload || !sig) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    // verify signature
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // parse payload
    let payloadObjUnknown: unknown;
    try {
      payloadObjUnknown = JSON.parse(base64urlToString(payload));
    } catch {
      return NextResponse.json({ error: "Invalid payload (parse)" }, { status: 400 });
    }

    if (!isObject(payloadObjUnknown)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const reportId = payloadObjUnknown.reportId;
    const exp = payloadObjUnknown.exp;

    if (typeof reportId !== "string" || !reportId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const expNum = asNumberLike(exp);
    if (!expNum) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (Date.now() > expNum) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    // 1) load report from Supabase
    const { data: report, error: loadErr } = await supabase
      .from("reports")
      .select("id,email,url,goal,result_json,status,created_at")
      .eq("id", reportId)
      .single();

    if (loadErr || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // 2) update status to confirmed
    await supabase.from("reports").update({ status: "confirmed" }).eq("id", reportId);

    const email = asString(report.email);
    const website = asString(report.url);
    const goal = asString(report.goal);

    const rUnknown: unknown = report.result_json;

    // result_json should be an object
    const r: JsonObject = isObject(rUnknown) ? rUnknown : {};

    const score = r.overallScore ?? "—";
    const strengths = Array.isArray(r.strengths) ? (r.strengths.filter((x) => typeof x === "string") as string[]) : [];
    const blockers = Array.isArray(r.blockers) ? (r.blockers.filter((x) => typeof x === "string") as string[]) : [];
    const quickWins = Array.isArray(r.quickWins)
      ? (r.quickWins.map(toQuickWin).filter(Boolean) as QuickWin[])
      : [];

    const copyPack = toCopyPack(r.copyPack);
    const snippet = toSnippet(r.snippet);

    const seoQuickWins = Array.isArray(r.seoQuickWins)
      ? (r.seoQuickWins.map(toSeoQuickWin).filter(Boolean) as SeoQuickWin[])
      : [];

    const summary = asString(r.summary);
    const disclaimer = asString(r.disclaimer);

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;max-width:720px;margin:0 auto;padding:18px">
        <h2 style="margin:0 0 10px 0">Dein Detailreport</h2>
        <div style="color:#444;margin-bottom:14px">
          <div><b>Website:</b> ${escapeHtml(website)}</div>
          <div><b>Ziel:</b> ${escapeHtml(goal)}</div>
          <div><b>Score:</b> ${escapeHtml(String(score))}/100</div>
        </div>

        <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin:14px 0">
          <div style="font-weight:700;margin-bottom:6px">Kurzfazit</div>
          <div style="color:#111">${escapeHtml(summary)}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px">
            <div style="font-weight:700;margin-bottom:8px">Was funktioniert</div>
            <ul style="margin:0;padding-left:18px;color:#111">
              ${strengths.slice(0, 3).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
            </ul>
          </div>

          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px">
            <div style="font-weight:700;margin-bottom:8px">Was bremst</div>
            <ul style="margin:0;padding-left:18px;color:#111">
              ${blockers.slice(0, 3).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
            </ul>
          </div>
        </div>

        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin:16px 0">
          <div style="font-weight:700;margin-bottom:8px">Quick Wins (15 Min)</div>
          <ul style="margin:0;padding-left:18px;color:#111">
            ${quickWins.slice(0, 3).map((q) => `<li><b>${escapeHtml(q.title)}:</b> ${escapeHtml(q.how)}</li>`).join("")}
          </ul>
        </div>

        ${copyPack ? `
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin:16px 0">
            <div style="font-weight:700;margin-bottom:8px">Textvorschläge (Copy Pack)</div>
            <div style="margin-bottom:10px"><b>Hero Headlines:</b>
              <ul style="margin:6px 0 0 0;padding-left:18px">
                ${copyPack.headlines.slice(0, 3).map((h) => `<li>${escapeHtml(h)}</li>`).join("")}
              </ul>
            </div>
            <div style="margin-bottom:10px"><b>Subheadline:</b> ${escapeHtml(copyPack.subheadline)}</div>
            <div><b>CTA Ideen:</b>
              <ul style="margin:6px 0 0 0;padding-left:18px">
                ${copyPack.ctas.slice(0, 3).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
              </ul>
            </div>
          </div>
        ` : ""}

        ${snippet ? `
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin:16px 0">
            <div style="font-weight:700;margin-bottom:8px">SEO Snippet Vorschlag (Google)</div>
            <div style="margin-bottom:6px"><b>Meta Title:</b> ${escapeHtml(snippet.metaTitle)}</div>
            <div style="margin-bottom:10px"><b>Meta Description:</b> ${escapeHtml(snippet.metaDescription)}</div>
            <div style="margin-bottom:6px"><b>Fokus Keyword:</b> ${escapeHtml(snippet.primaryKeyword)}</div>
            <div><b>Varianten:</b> ${snippet.secondaryKeywords.map((k) => escapeHtml(k)).join(" · ")}</div>
          </div>
        ` : ""}

        ${seoQuickWins.length ? `
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin:16px 0">
            <div style="font-weight:700;margin-bottom:8px">SEO Quick Wins (schnell & wirksam)</div>
            <ol style="margin:0;padding-left:18px;color:#111">
              ${seoQuickWins.slice(0, 5).map((x) => `
                <li style="margin-bottom:10px">
                  <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${badgeColor(x.impact)};color:#fff;font-size:12px;margin-right:8px;vertical-align:middle">
                    ${escapeHtml(x.impact.toUpperCase())}
                  </span>
                  <b>${escapeHtml(x.title)}</b><br/>
                  <span style="color:#333">${escapeHtml(x.how)}</span>
                </li>
              `).join("")}
            </ol>
          </div>
        ` : ""}

        <div style="border:1px dashed #d1d5db;border-radius:12px;padding:14px;margin:18px 0;background:#fafafa">
          <div style="font-weight:800;margin-bottom:6px">Nächster Schritt: 30-Tage AI Blueprint (199€)</div>
          <div style="color:#111;margin-bottom:10px">
            Wenn du willst, erstelle ich dir einen personalisierten 30-Tage Umsetzungsplan (Struktur, Texte, CTA-Architektur, SEO-Seitenplan) – basierend auf deinem Score.
          </div>
          <a href="${process.env.APP_URL}/blueprint" style="display:inline-block;padding:12px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">
            Blueprint freischalten →
          </a>
        </div>

        <div style="color:#666;font-size:12px;margin-top:14px">${escapeHtml(disclaimer)}</div>
      </div>
    `;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Dein Website Detailreport",
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}