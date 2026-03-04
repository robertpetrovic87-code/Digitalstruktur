import OpenAI from "openai";
import { BlueprintSchema, type Blueprint } from "./blueprint.schema";
import { buildBlueprintPrompt } from "./blueprint.prompt";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`${name} is missing`);
  return v;
}

const openai = new OpenAI({ apiKey: mustEnv("OPENAI_API_KEY") });

function stripJsonFences(s: string) {
  return s.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/, "").trim();
}

/**
 * Extract the first JSON object from a model output.
 * Works even if the model accidentally adds text before/after.
 */
function extractJsonObject(text: string): string {
  const cleaned = stripJsonFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON object found in model output. Got: ${cleaned.slice(0, 300)}`);
  }
  return cleaned.slice(start, end + 1);
}
function getOutputText(resp: unknown): string {
  if (!resp || typeof resp !== "object") return "";

  // 1) Wenn output_text vorhanden ist (manche SDKs)
  const r1 = resp as { output_text?: unknown };
  if (typeof r1.output_text === "string" && r1.output_text.trim().length > 0) {
    return r1.output_text;
  }

  // 2) Fallback: output array durchsuchen (Responses API üblich)
  const r2 = resp as { output?: unknown };
  const outArr = Array.isArray(r2.output) ? r2.output : [];
  for (const item of outArr) {
    if (!item || typeof item !== "object") continue;

    // message.content[] durchsuchen
    const msg = item as { content?: unknown };
    const contentArr = Array.isArray(msg.content) ? msg.content : [];
    for (const c of contentArr) {
      if (!c || typeof c !== "object") continue;

      // oft: { type: "output_text", text: "..." } oder { type:"text", text:"..." }
      const part = c as { type?: unknown; text?: unknown };
      if (typeof part.text === "string" && part.text.trim().length > 0) {
        return part.text;
      }
    }
  }

  return "";
}


async function callModel(prompt: { system: string; developer: string; user: string }) {
  const body: Record<string, unknown> = {
    model: "gpt-4.1-mini",
    max_output_tokens: 2500,
    temperature: 0.2,
    input: [
      { role: "system", content: prompt.system },
      { role: "developer", content: prompt.developer },
      { role: "user", content: prompt.user },
    ],
    text: {
      format: { type: "json_object" },
    },
  };

  const resp = await openai.responses.create(
    body as unknown as Parameters<typeof openai.responses.create>[0]
  );

  const out = getOutputText(resp);
  if (out.trim().length === 0) {
    throw new Error("OpenAI returned empty output text");
  }
  return out;
}

function tryParseModelJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    const json = extractJsonObject(text);
    return { ok: true, value: JSON.parse(json) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
    return { ok: false, error: msg };
  }
}

export async function generateBlueprintFromResult(input: {
  reportId: string;
  language: "de" | "en";
  resultJson: unknown;
  url?: string;
  goal?: string;
}): Promise<Blueprint> {
  const prompt = buildBlueprintPrompt({
    reportId: input.reportId,
    language: input.language,
    resultJson: input.resultJson,
    url: input.url,
    goal: input.goal,
  });

  // 1) First attempt
  const raw1 = await callModel(prompt);
  const parsedAttempt1 = tryParseModelJson(raw1);

  if (parsedAttempt1.ok) {
    const v1 = BlueprintSchema.safeParse(parsedAttempt1.value);
    if (v1.success) return v1.data;

    // SCHEMA repair (JSON is valid but wrong shape)
    const issues = v1.error.issues.map((i) => ({
      path: i.path,
      message: i.message,
      code: i.code,
    }));

    const repairPrompt = {
      system: prompt.system,
      developer: [
        prompt.developer,
        "",
        "REPAIR MODE (SCHEMA):",
        "- The previous JSON is valid JSON but does NOT match the schema.",
        "- Fix ALL missing/invalid fields so it matches the schema EXACTLY.",
        "- Return ONLY valid JSON. No prose. No markdown. No backticks.",
        "- You MUST include every required top-level key from the schema.",
      ].join("\n"),
      user: JSON.stringify(
        {
          task: "Repair the JSON to fully match BlueprintSchema v1.0. Return ONLY corrected JSON.",
          reportId: input.reportId,
          language: input.language,
          url: input.url ?? null,
          goal: input.goal ?? null,
          schema_errors: issues,
          previous_json: parsedAttempt1.value,
        },
        null,
        2
      ),
    };

    const raw2 = await callModel(repairPrompt);
    const parsed2 = tryParseModelJson(raw2);
    if (!parsed2.ok) {
      throw new Error(`Repair output still invalid JSON: ${parsed2.error}`);
    }
    return BlueprintSchema.parse(parsed2.value);
  }

  // JSON repair (model returned broken JSON)
  const jsonRepairPrompt = {
    system: prompt.system,
    developer: [
      prompt.developer,
      "",
      "REPAIR MODE (JSON):",
      "- The previous output contains BROKEN/INVALID JSON (parse error).",
      "- You must return a SINGLE valid JSON object that matches the schema EXACTLY.",
      "- Return ONLY JSON. No prose. No markdown. No backticks.",
      "- Ensure commas/brackets/quotes are correct.",
      "- You MUST include every required top-level key from the schema.",
    ].join("\n"),
    user: JSON.stringify(
      {
        task: "Return valid JSON matching BlueprintSchema v1.0.",
        reportId: input.reportId,
        language: input.language,
        parse_error: parsedAttempt1.error,
        previous_raw_output: raw1.slice(0, 12000), // keep it bounded
      },
      null,
      2
    ),
  };

  const raw2 = await callModel(jsonRepairPrompt);
  const parsed2 = tryParseModelJson(raw2);
  if (!parsed2.ok) {
    throw new Error(`Repair output invalid JSON: ${parsed2.error}`);
  }

  return BlueprintSchema.parse(parsed2.value);
}