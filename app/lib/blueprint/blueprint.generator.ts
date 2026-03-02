// app/lib/blueprint/blueprint.generator.ts
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
  return s
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeJsonParse(text: string): unknown {
  const cleaned = stripJsonFences(text);

  // Quick-path
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the first JSON object block as fallback
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      return JSON.parse(candidate);
    }
    throw new Error("Model output is not valid JSON");
  }
}

function normalizeBlueprintShape(input: unknown, reportId: string, language: "de" | "en"): unknown {
  // Ensure object
  if (!input || typeof input !== "object") return input;

  const obj = input as Record<string, unknown>;

  // Hard guarantees (do not rely on model)
  obj.version = "1.0";
  obj.report_id = reportId;
  obj.language = language;
  if (typeof obj.created_at !== "string" || Number.isNaN(Date.parse(obj.created_at))) {
    obj.created_at = new Date().toISOString();
  }

  return obj;
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
}

/**
 * Generates a Blueprint JSON, validates via Zod, retries once with a repair prompt if needed.
 */
export async function generateBlueprintFromResult(input: {
  reportId: string;
  language: "de" | "en";
  resultJson: unknown;
  url?: string;
  goal?: string;
  model?: string; // optional override
}): Promise<Blueprint> {
  const model = input.model ?? "gpt-4.1-mini"; // good quality/cost balance

  // 1) First attempt
  const basePrompt = buildBlueprintPrompt({
    reportId: input.reportId,
    language: input.language,
    resultJson: input.resultJson,
    url: input.url,
    goal: input.goal,
  });

  const firstText = await callModelForJson({
    model,
    system: basePrompt.system,
    developer: basePrompt.developer,
    user: basePrompt.user,
  });

  try {
    const parsed = safeJsonParse(firstText);
    const normalized = normalizeBlueprintShape(parsed, input.reportId, input.language);
    return BlueprintSchema.parse(normalized);
  } catch (e1: unknown) {
    // 2) One repair retry (important: ONLY 1 retry to control cost/time)
    const repairText = await callModelForRepair({
      model,
      originalPrompt: basePrompt,
      badOutput: firstText,
      error: errorMessage(e1),
      reportId: input.reportId,
      language: input.language,
    });

    const parsed2 = safeJsonParse(repairText);
    const normalized2 = normalizeBlueprintShape(parsed2, input.reportId, input.language);
    return BlueprintSchema.parse(normalized2);
  }
}

async function callModelForJson(args: {
  model: string;
  system: string;
  developer: string;
  user: string;
}): Promise<string> {
  const resp = await openai.responses.create({
    model: args.model,
    input: [
      { role: "system", content: args.system },
      { role: "developer", content: args.developer },
      { role: "user", content: args.user },
    ],
    // Optional: If your SDK/model supports strict JSON schema mode later, we can upgrade.
  });

  const text = (resp.output_text ?? "").trim();
  if (!text) throw new Error("OpenAI returned empty output");
  return text;
}

async function callModelForRepair(args: {
  model: string;
  originalPrompt: { system: string; developer: string; user: string };
  badOutput: string;
  error: string;
  reportId: string;
  language: "de" | "en";
}): Promise<string> {
  const repairInstructions = [
    "You must FIX the JSON to match the schema exactly.",
    "Return ONLY valid JSON. No markdown. No backticks. No explanations.",
    `Hard requirements: version="1.0", report_id="${args.reportId}", language="${args.language}", created_at=ISO string.`,
    "Do not add extra keys outside the schema.",
    "If fields are missing, add them with best-effort content based on the analysis.",
  ].join("\n");

  const resp = await openai.responses.create({
    model: args.model,
    input: [
      { role: "system", content: args.originalPrompt.system },
      { role: "developer", content: args.originalPrompt.developer },
      { role: "developer", content: repairInstructions },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "Repair the invalid JSON output to valid schema-compliant JSON.",
            why_failed: args.error,
            bad_output: args.badOutput,
          },
          null,
          2
        ),
      },
    ],
  });

  const text = (resp.output_text ?? "").trim();
  if (!text) throw new Error("OpenAI returned empty output on repair");
  return text;
}