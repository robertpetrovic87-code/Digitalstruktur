import OpenAI from "openai";
import { BlueprintSchema, type Blueprint } from "./blueprint.schema";
import { buildBlueprintPrompt } from "./blueprint.prompt";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim()) return v!;
  throw new Error(`${name} is missing`);
}

const openai = new OpenAI({ apiKey: mustEnv("OPENAI_API_KEY") });

function stripJsonFences(s: string) {
  return s.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/, "").trim();
}

async function callModel(prompt: { system: string; developer: string; user: string }) {
  const resp = await openai.responses.create({
    model: "gpt-4.1-mini",
    max_output_tokens: 3500,
    input: [
      { role: "system", content: prompt.system },
      { role: "developer", content: prompt.developer },
      { role: "user", content: prompt.user },
    ],
  });

  return resp.output_text ?? "";
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
  const text1 = await callModel(prompt);
  const parsed1 = JSON.parse(stripJsonFences(text1));
  const v1 = BlueprintSchema.safeParse(parsed1);

  if (v1.success) return v1.data;

  // 2) Repair attempt
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
      "- The previous JSON did NOT match the schema.",
      "- Fix ALL missing/invalid fields so it matches the schema EXACTLY.",
      "- Return ONLY valid JSON. No prose. No markdown. No backticks.",
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
  const parsed2 = JSON.parse(stripJsonFences(text2));

  // Final strict parse (if this fails, it's truly broken)
  return BlueprintSchema.parse(parsed2);
}