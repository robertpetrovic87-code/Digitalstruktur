// blueprint.schema.ts
import { z } from "zod";

/**
 * v1.0 - German-first Blueprint schema
 * Goal: high perceived value, no overwhelm, easy to render + PDF-export.
 */

const IsoDateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "Invalid ISO date string",
});

const CopyBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("headline"),
    content: z.string().min(3),
  }),
  z.object({
    type: z.literal("paragraph"),
    content: z.string().min(10),
  }),
  z.object({
    type: z.literal("bullets"),
    content: z.array(z.string().min(3)).min(3).max(8),
  }),
  z.object({
    type: z.literal("quote"),
    content: z.string().min(10),
  }),
  z.object({
    type: z.literal("cta"),
    content: z.object({
      label: z.string().min(2),
      destination: z.enum(["contact", "calendar", "checkout", "lead_magnet", "pricing"]),
      note: z.string().optional(), // e.g. "Above the fold", "After proof section"
    }),
  }),
]);

const RoadmapTaskSchema = z.object({
  title: z.string().min(5),
  why_it_matters: z.string().min(10),
  steps: z.array(z.string().min(5)).min(2).max(6),
  effort: z.enum(["S", "M", "L"]),
  impact: z.enum(["Low", "Medium", "High"]),
  owner: z.enum(["founder", "designer", "dev", "marketing"]),
  deliverable: z.string().min(5),

  // Helpful for UI/PDF checklists. Optional and defaults to false in UI.
  checklist_item: z.boolean().optional(),
});

export const BlueprintSchema = z.object({
  version: z.literal("1.0"),
  report_id: z.string().uuid(),
  created_at: IsoDateString,
  language: z.enum(["de", "en"]).default("de"),

  // Short “how to use this” so users don’t feel overwhelmed.
  usage_guide: z.object({
  read_time_minutes: z.number().int().min(1).max(30).default(8),
  how_to_start: z.array(z.string()).min(3).max(8).default([
    "Lies zuerst die Executive Summary.",
    "Setze Woche 1 um, bevor du weitergehst.",
    "Nutze die Checklisten für jeden Task.",
  ]),
  overwhelm_guardrails: z.array(z.string()).min(3).max(8).default([
    "Maximal 1 großes Thema pro Tag.",
    "Wenn etwas unklar ist: erst Hero + CTA klären.",
    "Lieber 80% live als 100% perfekt.",
  ]),
}).default({
  read_time_minutes: 8,
  how_to_start: [
    "Lies zuerst die Executive Summary.",
    "Setze Woche 1 um, bevor du weitergehst.",
    "Nutze die Checklisten für jeden Task.",
  ],
  overwhelm_guardrails: [
    "Maximal 1 großes Thema pro Tag.",
    "Wenn etwas unklar ist: erst Hero + CTA klären.",
    "Lieber 80% live als 100% perfekt.",
  ],
}),

  executive_summary: z.object({
    one_liner: z.string().min(10),
    top_priorities: z.array(z.string().min(5)).min(3).max(7),
    expected_outcomes_30d: z.array(z.string().min(5)).min(2).max(5),
  }),

  positioning: z.object({
    target_customer: z.object({
      who: z.string().min(5),
      pains: z.array(z.string().min(5)).min(3).max(8),
      desired_outcomes: z.array(z.string().min(5)).min(3).max(8),
    }),
    offer: z.object({
      promise: z.string().min(10),
      mechanism: z.string().min(10).optional(),
      proof_points: z.array(z.string().min(5)).min(2).max(6),
      differentiation: z.array(z.string().min(5)).min(2).max(6),
    }),
    messaging_pillars: z
      .array(
        z.object({
          pillar: z.string().min(3),
          explanation: z.string().min(10),
          example_copy: z.string().min(10),
        })
      )
      .min(3)
      .max(6),
  }),

  hero: z.object({
    goal: z.string().min(5),
    structure: z.object({
      headline: z.string().min(5),
      subheadline: z.string().min(10),
      bullets: z.array(z.string().min(3)).min(3).max(6),
      primary_cta: z.object({
        label: z.string().min(2),
        destination: z.enum(["contact", "calendar", "checkout", "lead_magnet", "pricing"]),
      }),
      secondary_cta: z.object({
        label: z.string().min(2),
        destination: z.enum(["case_studies", "about", "pricing", "examples"]),
      }),
      trust_elements: z.array(z.string().min(3)).min(2).max(6),
    }),
    variants: z
      .array(
        z.object({
          angle: z.string().min(3),
          headline: z.string().min(5),
          subheadline: z.string().min(10),
        })
      )
      .min(2)
      .max(4),
  }),

  homepage_sections: z
    .array(
      z.object({
        id: z.string().min(2), // e.g. "problem", "solution", "proof"
        title: z.string().min(3),
        intent: z.string().min(10),
        copy_blocks: z.array(CopyBlockSchema).min(2).max(8),
      })
    )
    .min(6)
    .max(10),

  cta_architecture: z.object({
    primary_cta: z.object({
      label: z.string().min(2),
      placement: z.array(z.enum(["hero", "mid_page", "end_page", "sticky"])).min(2).max(4),
      rationale: z.string().min(10),
    }),
    secondary_ctas: z
      .array(
        z.object({
          label: z.string().min(2),
          placement: z.array(z.enum(["hero", "mid_page", "end_page"])).min(1).max(3),
          rationale: z.string().min(10),
        })
      )
      .min(1)
      .max(3),
    micro_ctas: z.array(z.string().min(3)).min(3).max(8),
  }),

  seo_plan: z.object({
    primary_intent: z.string().min(5),
    pages: z
      .array(
        z.object({
          slug: z.string().min(2),
          title: z.string().min(5),
          intent: z.enum(["informational", "commercial", "transactional", "navigational"]),
          primary_keyword: z.string().min(3),
          secondary_keywords: z.array(z.string().min(3)).max(6).optional(),
          outline_h2: z.array(z.string().min(3)).min(4).max(10),
          internal_links_to: z.array(z.string().min(2)).max(8).optional(),
          cta: z.string().min(3),
        })
      )
      .min(5)
      .max(12),
  }),

  // Week-based roadmap (no Day 1-3), max 6 tasks per week to avoid overwhelm.
  roadmap_30d: z
    .array(
      z.object({
        phase: z.enum(["Week 1", "Week 2", "Week 3", "Week 4"]),
        objective: z.string().min(10),
        tasks: z.array(RoadmapTaskSchema).min(4).max(6),
      })
    )
    .length(4),

  // Small but high-value prompt library (bonus)
  ai_prompt_library: z
    .array(
      z.object({
        title: z.string().min(5),
        when_to_use: z.string().min(10),
        prompt: z.string().min(50),
        inputs_needed: z.array(z.string().min(3)).min(2).max(6),
      })
    )
    .min(6)
    .max(10),

  assumptions_and_notes: z.array(z.string().min(5)).max(10).optional(),
});

export type Blueprint = z.infer<typeof BlueprintSchema>;