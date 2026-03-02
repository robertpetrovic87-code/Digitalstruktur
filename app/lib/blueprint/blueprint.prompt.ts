// blueprint.prompt.ts
export function buildBlueprintPrompt(params: {
  reportId: string;
  language: "de" | "en";
  resultJson: unknown; // from reports.result_json
  url?: string;
  goal?: string;
}) {
  const { reportId, language, resultJson, url, goal } = params;

  const langLabel = language === "de" ? "German (de)" : "English (en)";

  return {
    system: [
      "You are a senior conversion copywriter, UX strategist, and SEO planner for small businesses.",
      "You produce practical, non-overwhelming, high-clarity implementation plans.",
      "Return ONLY valid JSON. No prose. No markdown. No backticks.",
      "The JSON must match the provided schema exactly.",
    ].join("\n"),

    developer: [
      "HARD RULES (must follow):",
      `- Output must be valid JSON (UTF-8).`,
      `- version must be "1.0".`,
      `- report_id must equal "${reportId}".`,
      `- created_at must be an ISO datetime string.`,
      `- language must be "${language}".`,
      `- Use the analysis_result_json as the main source of truth.`,
      `- If data is missing, make minimal assumptions and list them in assumptions_and_notes.`,
      `- Never include personal data. Never invent testimonials with names.`,
      "",
      "QUALITY BAR:",
      "- Be concrete: give specific headlines, bullets, section titles, and task deliverables.",
      "- Avoid generic advice like 'improve clarity' without telling what to write/do.",
      "- Prioritize highest impact items first.",
      "",
      "ANTI-OVERWHELM GUARDRAILS:",
      "- Roadmap must be exactly 4 items: Week 1, Week 2, Week 3, Week 4 (no Day 1-3).",
      "- Each week must contain 4–6 tasks only (never more).",
      "- Each task must have: title, why_it_matters, 2–6 steps, effort (S/M/L), impact (Low/Medium/High), owner, deliverable.",
      "- Keep text crisp. Prefer bullets over long paragraphs.",
      "",
      "HOMEPAGE SECTIONS:",
      "- Provide 6–10 homepage_sections.",
      "- Each section has 2–8 copy_blocks.",
      "- copy_blocks must follow types exactly: headline | paragraph | bullets | quote | cta.",
      "- For bullets: 3–8 bullets max.",
      "",
      "HERO:",
      "- Provide one strong hero.structure (headline, subheadline, bullets, CTAs, trust).",
      "- Provide 2–4 hero.variants with different angles (ROI, speed, risk reduction, simplicity).",
      "",
      "SEO PLAN:",
      "- Provide 5–12 pages max.",
      "- Each page needs: slug, title, intent, primary_keyword, outline_h2 (4–10), CTA.",
      "",
      "AI PROMPT LIBRARY (BONUS):",
      "- Provide 6–8 prompts (ai_prompt_library).",
      "- Each prompt must be copy-paste ready, in the same language as the blueprint.",
      "- Each prompt must include inputs_needed (2–6).",
      "- Prompts should help the user finish tasks faster (hero, CTA, proof, landingpage outline, meta tags, FAQ).",
      "",
      `LANGUAGE: ${langLabel}.`,
    ].join("\n"),

    user: JSON.stringify(
      {
        task: "Generate an AI Website Blueprint (30-day plan) as JSON according to the schema.",
        context: {
          reportId,
          url: url ?? null,
          goal: goal ?? null,
          language,
        },
        output_contract: {
          must_match_schema: "BlueprintSchema v1.0",
          roadmap_format: "Exactly Week 1-4, 4–6 tasks per week",
          style: "Clear, practical, non-overwhelming, high signal",
          include_bonus: "Include ai_prompt_library (6–8 prompts)",
        },
        analysis_result_json: resultJson,
      },
      null,
      2
    ),
  };
}