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

async function callModel(prompt: { system: string; developer: string; user: string }) {
  const resp = await openai.responses.create({
    model: "gpt-4.1-mini",
    // Higher to avoid truncated JSON -> "Unexpected end of JSON input"
    max_output_tokens: 2500,
    input: [
      { role: "system", content: prompt.system },
      { role: "developer", content: prompt.developer },
      { role: "user", content: prompt.user },
    ],
  });

  const out = resp.output_text ?? "";
  if (out.trim().length === 0) {
    throw new Error("OpenAI returned empty output_text");
  }
  return out;
}

function safeJsonParseFromModel(text: string): unknown {
  const json = extractJsonObject(text);
  return JSON.parse(json);
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
  let parsed1: unknown;
  try {
    const text1 = await callModel(prompt);
    parsed1 = safeJsonParseFromModel(text1);
  } catch {
    // parsing/extraction failed -> force repair
    parsed1 = null;
  }

  const v1 = BlueprintSchema.safeParse(parsed1);
  if (v1.success) return v1.data;

  // 2) Repair attempt (send schema issues back)
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
      "REPAIR MODE:",
      "- The previous JSON did NOT match the schema OR was invalid JSON.",
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
        previous_json: parsed1,
      },
      null,
      2
    ),
  };

  const text2 = await callModel(repairPrompt);
  const parsed2 = safeJsonParseFromModel(text2);

  // Final strict parse (if this fails, it's truly broken)
  return BlueprintSchema.parse(parsed2);
}