// app/api/analyze/route.ts
import { z } from "zod";

const BodySchema = z.object({
  url: z.string().url(),
  goal: z.enum(["leads", "sales", "branding"]),
});

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
  // matches: <meta name="description" content="...">
  // also works if attributes are reversed
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
    if (out.length >= (tag === "h1" ? 1 : 6)) break; // MVP limits
  }
  return out;
}

async function fetchWebsiteData(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      // Minimaler Browser-Header, reduziert 403 bei manchen Seiten
      "User-Agent":
        "Mozilla/5.0 (compatible; WebsiteAnalyzerBot/1.0; +https://example.com)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(
        "Diese Website blockiert automatische Analysen (403). Tipp: Viele Seiten haben Bot-Schutz. Versuch eine andere URL oder nutze später den Text-Upload."
      );
    }
    throw new Error(`Website nicht erreichbar (${res.status})`);
  }

  const html = await res.text();

  const title = extractTag(html, "title");
  const metaDescription = extractMeta(html, "description");
  const h1 = extractHeadings(html, "h1")[0] ?? null;
  const h2 = extractHeadings(html, "h2");

  const pageText = stripHtml(html).slice(0, 12000); // MVP: Prompt klein halten

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

Use these evaluation questions internally (do NOT output Q&A):
CLARITY:
- Is the offer stated without buzzwords?
- Is the target audience explicit?
- Is a concrete outcome/benefit stated?
- Is the main message visible immediately?
- Can the offer be summarized in one sentence without guessing?

AUDIENCE FIT:
- Are specific problems/desires mentioned?
- Is language/tonality aligned to the audience?
- Are relevant examples used?
- Is it implicitly clear who it's NOT for?
- Is the messaging specific vs generic?

TRUST:
- Are there proofs (results, references, examples, experience)?
- Does it feel real and consistent, not generic?
- Does it demonstrate insight/competence (not only marketing)?
- Is there a human/personal component?
- Would a stranger trust them?

CONVERSION:
- Is there a clear CTA?
- Is the next step low-friction?
- Is it explained what happens after the action?
- Does CTA match the preceding content?
- Are there not too many competing actions?

STRUCTURE:
- Is it well-structured and scannable?
- Are key infos easy to find?
- Is style/voice consistent?
- Is there a clear flow/story?
- Does anything feel chaotic?

SEO QUICK WINS (focus on fast and impactful, not deep tech):
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
- If business seems local (e.g., location/service), include local SEO suggestions.

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

type OutputContentItem = {
  type?: string;
  text?: string;
};

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const { pageText, title, metaDescription, h1, h2 } = await fetchWebsiteData(body.url);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY fehlt in .env.local" },
        { status: 500 }
      );
    }

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
        text: {
          format: { type: "json_object" },
        },
      }),
    });

    const llmJson = await llmRes.json();
    if (!llmRes.ok) {
      return Response.json(
        { error: llmJson?.error?.message || "LLM Fehler" },
        { status: 500 }
      );
    }

    const content = llmJson?.output?.[0]?.content as OutputContentItem[] | undefined;

    const textOut =
      llmJson?.output_text ??
      content?.find((c) => c.type === "output_text")?.text ??
      content?.[0]?.text ??
      null;

    if (!textOut) {
      return Response.json({ error: "Kein LLM Output" }, { status: 500 });
    }

    let result: unknown;
    try {
      result = JSON.parse(textOut);
    } catch {
      return Response.json(
        { error: "LLM Output ist kein gültiges JSON" },
        { status: 500 }
      );
    }

    // Optional: Debug payload in response (kannst du später entfernen)
    return Response.json({
      result,
      extracted: {
        title,
        metaDescription,
        h1,
        h2,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Fehler";
    return Response.json({ error: message }, { status: 400 });
  }
}