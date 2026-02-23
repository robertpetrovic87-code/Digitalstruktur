// app/api/analyze/route.ts
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const BodySchema = z.object({
  url: z.string().url(),
  goal: z.enum(["leads", "sales", "branding"]),
});

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(`${name} is missing`);
  }
  return v;
}

const supabase = createClient(
  mustEnv("SUPABASE_URL"),
  mustEnv("SUPABASE_SERVICE_ROLE_KEY") // server only
);

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
      "User-Agent":
        "Mozilla/5.0 (compatible; WebsiteAnalyzerBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
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

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const { pageText, title, metaDescription, h1, h2 } =
      await fetchWebsiteData(body.url);

    const apiKey = mustEnv("OPENAI_API_KEY");

    const llmRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
Analyse the following website and return STRICT JSON in German.

URL: ${body.url}
Goal: ${body.goal}

CONTENT:
${pageText}
        `,
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

    const textOut =
      llmJson?.output_text ??
      llmJson?.output?.[0]?.content?.[0]?.text ??
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

    // ✅ HIER PASSIERT DIE EINZIGE SPEICHERUNG
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
      return Response.json(
        { error: error?.message ?? "Supabase insert failed" },
        { status: 500 }
      );
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