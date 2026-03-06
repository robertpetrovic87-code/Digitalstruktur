// app/api/analyze/route.ts
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const BodySchema = z.object({
  url: z.string().url(),
  goal: z.enum(["leads", "sales", "branding"]),
});

const AuditResultSchema = z.object({
  overallScore: z.number(),
  goal: z.enum(["leads", "sales", "branding"]),
  categoryScores: z.object({
    clarity: z.number(),
    audienceFit: z.number(),
    trust: z.number(),
    conversion: z.number(),
    structure: z.number(),
  }),
  strengths: z.array(z.string()).length(3),
  blockers: z.array(z.string()).length(3),
  quickWins: z.array(z.object({ title: z.string(), how: z.string() })).min(2).max(3),
  copyPack: z.object({
    headlines: z.array(z.string()).length(3),
    subheadline: z.string(),
    ctas: z.array(z.string()).length(3),
  }),
  seoQuickWins: z
    .array(
      z.object({
        title: z.string(),
        how: z.string(),
        impact: z.enum(["high", "medium", "low"]),
      })
    )
    .length(5),
  snippet: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
    primaryKeyword: z.string(),
    secondaryKeywords: z.array(z.string()).length(3),
  }),
  detailedReport: z.object({
    clarity: z.string(),
    audienceFit: z.string(),
    trust: z.string(),
    conversion: z.string(),
    structure: z.string(),
  }),
  summary: z.string(),
  disclaimer: z.string(),
});

type AuditResult = z.infer<typeof AuditResultSchema>;

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

/**
 * ✅ Lazy init: creates supabase client only at request-time.
 * This prevents `next build` from crashing when env vars aren't present locally.
 */
function getSupabase() {
  return createClient(
    mustEnv("SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY") // server only
  );
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  if (!m?.[1]) return null;
  const txt = stripHtml(m[1]).trim();
  return txt ? txt.slice(0, 300) : null;
}

function extractMeta(html: string, name: string): string | null {
  const re1 = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["'][^>]*>`,
    "i"
  );
  const m = html.match(re1) ?? html.match(re2);
  const val = m?.[1]?.trim() ?? null;
  return val ? val.slice(0, 320) : null;
}

function extractHeadings(html: string, tag: "h1" | "h2"): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const txt = stripHtml(m[1]).trim();
    if (txt) out.push(txt);
    if (out.length >= (tag === "h1" ? 1 : 6)) break;
  }
  return out;
}

async function fetchWebsiteData(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; WebsiteAnalyzerBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(
        "Diese Website blockiert automatische Analysen (403). Tipp: Manche Seiten haben Bot-Schutz. Versuch eine andere URL."
      );
    }
    throw new Error(`Website nicht erreichbar (${res.status})`);
  }

  const html = await res.text();

  const title = extractTag(html, "title");
  const metaDescription = extractMeta(html, "description");
  const h1 = extractHeadings(html, "h1")[0] ?? null;
  const h2 = extractHeadings(html, "h2");

  const pageText = stripHtml(html).slice(0, 12000);

  return { pageText, title, metaDescription, h1, h2 };
}

function buildPrompt(args: {
  url: string;
  goal: "leads" | "sales" | "branding";
  pageText: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2: string[];
}) {
  return `
You are an expert conversion + messaging + SEO auditor for small businesses. Evaluate the website content and output STRICT JSON.

Context:
- URL: ${args.url}
- Goal: ${args.goal}
- Meta Title: ${args.title ?? "—"}
- Meta Description: ${args.metaDescription ?? "—"}
- H1: ${args.h1 ?? "—"}
- H2s: ${args.h2?.length ? args.h2.join(" | ") : "—"}

Scoring framework (0-20 each, total 0-100):
1) clarity
2) audienceFit
3) trust
4) conversion
5) structure

SEO QUICK WINS:
- Improve snippet (meta title/description) for clarity + CTR
- Suggest 1 primary keyword focus + 3 secondary keyword variants
- Suggest 5 quick SEO actions (<= 30 minutes each), ideally local SEO if relevant
- Suggest heading improvements (H1/H2) if unclear

Requirements:
- Output valid JSON ONLY (no markdown).
- Output language: German (de-DE). All strings must be in German.
- Provide exactly 3 strengths (short punchy headlines).
- Provide exactly 3 blockers (short punchy headlines).
- Provide 2-3 quickWins with {title, how} that can be done in <=15 minutes.
- Provide "copyPack" with 3 hero headlines, 1 subheadline, 3 CTAs (goal-aligned).
- Provide "seoQuickWins" as 5 items with {title, how, impact}.
- Provide "snippet" with improved metaTitle and metaDescription + keywords.
- Provide detailedReport fields with concrete advice (each 3-7 sentences).
- Keep text concise.
- Do not hallucinate precise numbers (no fake traffic, no fake conversion rates).

JSON schema:
{
  "overallScore": number,
  "goal": "leads"|"sales"|"branding",
  "categoryScores": {"clarity":number,"audienceFit":number,"trust":number,"conversion":number,"structure":number},
  "strengths": string[3],
  "blockers": string[3],
  "quickWins": [{"title":string,"how":string}],
  "copyPack": {"headlines": string[3], "subheadline": string, "ctas": string[3]},
  "seoQuickWins": [{"title": string, "how": string, "impact": "high"|"medium"|"low"}],
  "snippet": {"metaTitle": string, "metaDescription": string, "primaryKeyword": string, "secondaryKeywords": string[3]},
  "detailedReport": {"clarity":string,"audienceFit":string,"trust":string,"conversion":string,"structure":string},
  "summary": string,
  "disclaimer": string
}

Website content (may be partial):
${args.pageText}
`.trim();
}

type OutputContentItem = { type?: string; text?: string };

export async function POST(req: Request) {
  try {
    // ✅ supabase created at runtime (env checked here, not at build time)
    const supabase = getSupabase();

    const body = BodySchema.parse(await req.json());
    const { pageText, title, metaDescription, h1, h2 } = await fetchWebsiteData(body.url);

    const apiKey = mustEnv("OPENAI_API_KEY");

    const prompt = buildPrompt({
      url: body.url,
      goal: body.goal,
      pageText,
      title,
      metaDescription,
      h1,
      h2,
    });

    const llmRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        text: { format: { type: "json_object" } },
      }),
    });

    const llmJson: unknown = await llmRes.json().catch(() => null);

    if (!llmRes.ok) {
      const message =
        typeof llmJson === "object" &&
        llmJson !== null &&
        "error" in llmJson &&
        typeof (llmJson as { error?: { message?: unknown } }).error?.message === "string"
          ? ((llmJson as { error: { message: string } }).error.message as string)
          : "LLM Fehler";
      return Response.json({ error: message }, { status: 500 });
    }

    const content =
      typeof llmJson === "object" && llmJson !== null
        ? ((llmJson as { output?: Array<{ content?: OutputContentItem[] }> }).output?.[0]?.content ?? undefined)
        : undefined;

    const textOut =
      (typeof llmJson === "object" && llmJson !== null && "output_text" in llmJson
        ? (llmJson as { output_text?: unknown }).output_text
        : undefined) ??
      content?.find((c) => c.type === "output_text")?.text ??
      content?.[0]?.text ??
      null;

    if (typeof textOut !== "string" || textOut.trim().length === 0) {
      return Response.json({ error: "Kein LLM Output" }, { status: 500 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(textOut);
    } catch {
      return Response.json({ error: "LLM Output ist kein gültiges JSON" }, { status: 500 });
    }

    const parsed = AuditResultSchema.safeParse(parsedJson);

if (!parsed.success) {
  console.error("Zod validation error:", parsed.error.flatten());
  console.error("Invalid AI output:", JSON.stringify(parsedJson, null, 2));

  return Response.json(
    {
      error: "AI Output unvollständig/ungültig. Bitte erneut versuchen.",
      details: parsed.error.flatten(),
      invalidOutput: parsedJson,
    },
    { status: 502 }
  );
}

    const result: AuditResult = parsed.data;

    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          url: body.url,
          goal: body.goal,
          result_json: result,
          status: "analyzed",
          purchased_blueprint: false,
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      return Response.json({ error: error?.message ?? "Supabase insert failed" }, { status: 500 });
    }

    return Response.json({
      reportId: data.id,
      result,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Fehler";
    return Response.json({ error: message }, { status: 400 });
  }
}