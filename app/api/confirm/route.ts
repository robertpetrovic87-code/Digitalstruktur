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

// ---------- Type helpers ----------
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
  const headlines = Array.isArray(v.headlines)
    ? (v.headlines.filter((x) => typeof x === "string") as string[])
    : [];
  const ctas = Array.isArray(v.ctas)
    ? (v.ctas.filter((x) => typeof x === "string") as string[])
    : [];
  const subheadline = asString(v.subheadline);
  if (!headlines.length && !subheadline && !ctas.length) return null;
  return { headlines, subheadline, ctas };
}

type Snippet = {
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
};

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

    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

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

    const { data: report, error: loadErr } = await supabase
      .from("reports")
      .select("id,email,url,goal,result_json,status,created_at")
      .eq("id", reportId)
      .single();

    if (loadErr || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await supabase.from("reports").update({ status: "confirmed" }).eq("id", reportId);

    const email = asString(report.email);
    const website = asString(report.url);
    const goal = asString(report.goal);

    const rUnknown: unknown = report.result_json;
    const r: JsonObject = isObject(rUnknown) ? rUnknown : {};

    const score = r.overallScore ?? "—";
    const strengths = Array.isArray(r.strengths)
      ? (r.strengths.filter((x) => typeof x === "string") as string[])
      : [];
    const blockers = Array.isArray(r.blockers)
      ? (r.blockers.filter((x) => typeof x === "string") as string[])
      : [];
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

    const blueprintUrl = `${process.env.APP_URL}/blueprint?rid=${encodeURIComponent(reportId)}`;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:720px;margin:0 auto;padding:24px;background:#ffffff;color:#111827">
        <div style="margin-bottom:20px">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#f4f4f5;color:#3f3f46;font-size:12px;font-weight:700">
            AI Website Analyse
          </div>
          <h1 style="margin:16px 0 8px 0;font-size:30px;line-height:1.2;color:#111827">
            Dein Website Detailreport ist da
          </h1>
          <p style="margin:0;color:#52525b;font-size:16px;line-height:1.7">
            Hier ist deine Analyse mit den wichtigsten Hebeln für mehr Klarheit, bessere Nutzerführung und mehr Anfragen über deine Website.
          </p>
        </div>

        <div style="border:1px solid #e5e7eb;border-radius:18px;padding:18px;background:#fafafa;margin:18px 0">
          <div style="font-size:14px;color:#52525b;margin-bottom:8px"><b>Website:</b> ${escapeHtml(website)}</div>
          <div style="font-size:14px;color:#52525b;margin-bottom:8px"><b>Ziel:</b> ${escapeHtml(goal)}</div>
          <div style="font-size:14px;color:#52525b"><b>Gesamtscore:</b> ${escapeHtml(String(score))}/100</div>
        </div>

        <div style="background:#111827;border-radius:20px;padding:20px;color:#ffffff;margin:22px 0">
          <div style="font-size:13px;color:#cbd5e1;font-weight:700;letter-spacing:.02em">Kurzfazit</div>
          <div style="margin-top:10px;font-size:16px;line-height:1.7;color:#f8fafc">
            ${escapeHtml(summary || "Deine Website hat Potenzial, durch klarere Struktur, stärkere CTAs und bessere Nutzerführung deutlich mehr Wirkung zu erzielen.")}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0">
          <div style="border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#ffffff">
            <div style="font-weight:800;margin-bottom:10px;color:#111827">Was bereits funktioniert</div>
            <ul style="margin:0;padding-left:18px;color:#374151;line-height:1.7">
              ${strengths.slice(0, 3).map((s) => `<li>${escapeHtml(s)}</li>`).join("") || "<li>Es wurden erste positive Ansätze erkannt.</li>"}
            </ul>
          </div>

          <div style="border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#ffffff">
            <div style="font-weight:800;margin-bottom:10px;color:#111827">Was dich aktuell bremst</div>
            <ul style="margin:0;padding-left:18px;color:#374151;line-height:1.7">
              ${blockers.slice(0, 3).map((s) => `<li>${escapeHtml(s)}</li>`).join("") || "<li>Einige Reibungspunkte verhindern aktuell mehr Wirkung.</li>"}
            </ul>
          </div>
        </div>

        <div style="border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#ffffff;margin:20px 0">
          <div style="font-weight:800;margin-bottom:10px;color:#111827">Quick Wins für schnelle Verbesserungen</div>
          <ul style="margin:0;padding-left:18px;color:#374151;line-height:1.8">
            ${quickWins.slice(0, 3).map((q) => `<li><b>${escapeHtml(q.title)}:</b> ${escapeHtml(q.how)}</li>`).join("") || "<li>Deine Analyse enthält mehrere schnell umsetzbare Verbesserungen.</li>"}
          </ul>
        </div>

        ${copyPack ? `
          <div style="border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#ffffff;margin:20px 0">
            <div style="font-weight:800;margin-bottom:10px;color:#111827">Copy Ideen für deine Website</div>
            <div style="margin-bottom:10px;color:#374151">
              <b>Hero Headlines:</b>
              <ul style="margin:6px 0 0 0;padding-left:18px;line-height:1.7">
                ${copyPack.headlines.slice(0, 3).map((h) => `<li>${escapeHtml(h)}</li>`).join("")}
              </ul>
            </div>
            <div style="margin-bottom:10px;color:#374151"><b>Subheadline:</b> ${escapeHtml(copyPack.subheadline)}</div>
            <div style="color:#374151">
              <b>CTA Ideen:</b>
              <ul style="margin:6px 0 0 0;padding-left:18px;line-height:1.7">
                ${copyPack.ctas.slice(0, 3).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
              </ul>
            </div>
          </div>
        ` : ""}

        ${snippet ? `
          <div style="border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#ffffff;margin:20px 0">
            <div style="font-weight:800;margin-bottom:10px;color:#111827">SEO Snippet Vorschlag</div>
            <div style="margin-bottom:8px;color:#374151"><b>Meta Title:</b> ${escapeHtml(snippet.metaTitle)}</div>
            <div style="margin-bottom:10px;color:#374151"><b>Meta Description:</b> ${escapeHtml(snippet.metaDescription)}</div>
            <div style="margin-bottom:8px;color:#374151"><b>Fokus Keyword:</b> ${escapeHtml(snippet.primaryKeyword)}</div>
            <div style="color:#374151"><b>Varianten:</b> ${snippet.secondaryKeywords.map((k) => escapeHtml(k)).join(" · ")}</div>
          </div>
        ` : ""}

        ${seoQuickWins.length ? `
          <div style="border:1px solid #e5e7eb;border-radius:18px;padding:16px;background:#ffffff;margin:20px 0">
            <div style="font-weight:800;margin-bottom:10px;color:#111827">SEO Quick Wins</div>
            <ol style="margin:0;padding-left:18px;color:#374151;line-height:1.8">
              ${seoQuickWins.slice(0, 5).map((x) => `
                <li style="margin-bottom:12px">
                  <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${badgeColor(x.impact)};color:#fff;font-size:12px;margin-right:8px;vertical-align:middle">
                    ${escapeHtml(x.impact.toUpperCase())}
                  </span>
                  <b>${escapeHtml(x.title)}</b><br/>
                  <span>${escapeHtml(x.how)}</span>
                </li>
              `).join("")}
            </ol>
          </div>
        ` : ""}

        <div style="margin:28px 0;border:1px solid #d4d4d8;border-radius:22px;padding:22px;background:linear-gradient(180deg,#fafafa 0%, #ffffff 100%)">
          <div style="font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#71717a;margin-bottom:8px">
            Nächster Schritt
          </div>
          <div style="font-size:24px;line-height:1.3;font-weight:800;color:#111827;margin-bottom:10px">
            Dein individueller 30-Tage Website Blueprint
          </div>
          <p style="margin:0 0 14px 0;color:#3f3f46;line-height:1.7">
            Du hast jetzt die Analyse gesehen. Der Blueprint zeigt dir Schritt für Schritt,
            <b> welche Änderungen auf deiner Website die größte Wirkung haben</b> und
            <b> in welcher Reihenfolge du sie umsetzen solltest</b>.
          </p>

          <div style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;background:#ffffff;margin:16px 0">
            <div style="font-weight:800;color:#111827;margin-bottom:10px">Beispiel: So kann dein Blueprint aufgebaut sein</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
              <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#fafafa">
                <div style="font-size:12px;font-weight:700;color:#71717a;text-transform:uppercase">Woche 1</div>
                <div style="margin-top:6px;font-weight:700;color:#111827">Struktur verbessern</div>
                <div style="margin-top:8px;font-size:14px;color:#52525b;line-height:1.6">
                  Hero schärfen, CTA sichtbarer machen, Navigation vereinfachen
                </div>
              </div>

              <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#fafafa">
                <div style="font-size:12px;font-weight:700;color:#71717a;text-transform:uppercase">Woche 2</div>
                <div style="margin-top:6px;font-weight:700;color:#111827">Conversion erhöhen</div>
                <div style="margin-top:8px;font-size:14px;color:#52525b;line-height:1.6">
                  Vertrauen stärken, Angebot klarer machen, Formular vereinfachen
                </div>
              </div>

              <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;background:#fafafa">
                <div style="font-size:12px;font-weight:700;color:#71717a;text-transform:uppercase">Woche 3</div>
                <div style="margin-top:6px;font-weight:700;color:#111827">Sichtbarkeit aufbauen</div>
                <div style="margin-top:8px;font-size:14px;color:#52525b;line-height:1.6">
                  Content-Ideen priorisieren, Seitenstruktur verbessern, SEO gezielt ausbauen
                </div>
              </div>
            </div>
          </div>

          <div style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;background:#ffffff;margin:16px 0">
            <div style="font-weight:800;color:#111827;margin-bottom:10px">Was du bekommst</div>
            <ul style="margin:0;padding-left:18px;color:#3f3f46;line-height:1.8">
              <li>klaren 30-Tage Umsetzungsplan</li>
              <li>Conversion Verbesserungen für mehr Anfragen</li>
              <li>Struktur- und Seitenempfehlungen</li>
              <li>SEO- und Content-Ideen</li>
              <li>klare nächste Schritte statt allgemeiner Tipps</li>
            </ul>
          </div>

          <div style="margin-top:18px">
            <a href="${blueprintUrl}" style="display:inline-block;padding:14px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:800">
              Deinen individuellen Blueprint freischalten – 199€
            </a>
          </div>

          <div style="margin-top:12px;font-size:14px;color:#52525b">
            Individuell für dich erstellt. Kein generischer AI-Report.
          </div>
        </div>

        <div style="margin-top:20px;font-size:12px;color:#71717a;line-height:1.6">
          ${escapeHtml(disclaimer)}
        </div>
      </div>
    `;

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Deine Website Analyse + konkrete nächste Schritte",
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}