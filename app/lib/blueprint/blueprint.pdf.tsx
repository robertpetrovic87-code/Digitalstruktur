// app/lib/blueprint/blueprint.pdf.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Blueprint } from "./blueprint.schema";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.4 },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  h3: { fontSize: 12, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  p: { marginBottom: 6, color: "#111827" },
  muted: { color: "#6B7280" },
  card: { border: "1 solid #E5E7EB", borderRadius: 10, padding: 12, marginTop: 10 },
  row: { flexDirection: "row", gap: 8 },
  bulletRow: { flexDirection: "row", gap: 8, marginBottom: 3 },
  bulletDot: { width: 10, textAlign: "center" },
  checkbox: {
    width: 12,
    height: 12,
    border: "1 solid #111827",
    borderRadius: 2,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginTop: 10, marginBottom: 10 },
});

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text>{b}</Text>
        </View>
      ))}
    </View>
  );
}

export function BlueprintPdfDoc(props: {
  blueprint: Blueprint;
  meta: { url?: string | null; goal?: string | null };
}) {
  const { blueprint, meta } = props;

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>AI Website Blueprint</Text>
        <Text style={[styles.p, styles.muted]}>30-Tage Umsetzungsplan (Week 1–4)</Text>
        <View style={styles.divider} />
        <Text style={styles.p}>
          <Text style={styles.muted}>Website: </Text>
          {meta.url ?? "—"}
        </Text>
        <Text style={styles.p}>
          <Text style={styles.muted}>Ziel: </Text>
          {meta.goal ?? "—"}
        </Text>
        <Text style={styles.p}>
          <Text style={styles.muted}>Erstellt am: </Text>
          {blueprint.created_at}
        </Text>

        <View style={styles.card}>
          <Text style={styles.h2}>Executive Summary</Text>
          <Text style={styles.p}>{blueprint.executive_summary.one_liner}</Text>

          <Text style={styles.h3}>Top Prioritäten</Text>
          <BulletList items={blueprint.executive_summary.top_priorities} />

          <Text style={styles.h3}>Erwartete Outcomes (30 Tage)</Text>
          <BulletList items={blueprint.executive_summary.expected_outcomes_30d} />
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>So nutzt du den Blueprint</Text>
          <Text style={[styles.p, styles.muted]}>
            Lesezeit: ca. {blueprint.usage_guide.read_time_minutes} Minuten
          </Text>
          <Text style={styles.h3}>Start</Text>
          <BulletList items={blueprint.usage_guide.how_to_start} />
          <Text style={styles.h3}>Anti-Overwhelm</Text>
          <BulletList items={blueprint.usage_guide.overwhelm_guardrails} />
        </View>
      </Page>

      {/* Core sections */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Positionierung</Text>
        <View style={styles.card}>
          <Text style={styles.h3}>Zielkunde</Text>
          <Text style={styles.p}>{blueprint.positioning.target_customer.who}</Text>
          <Text style={styles.h3}>Pains</Text>
          <BulletList items={blueprint.positioning.target_customer.pains} />
          <Text style={styles.h3}>Desired outcomes</Text>
          <BulletList items={blueprint.positioning.target_customer.desired_outcomes} />
        </View>

        <View style={styles.card}>
          <Text style={styles.h3}>Offer</Text>
          <Text style={styles.p}>
            <Text style={styles.muted}>Promise: </Text>
            {blueprint.positioning.offer.promise}
          </Text>
          {blueprint.positioning.offer.mechanism ? (
            <Text style={styles.p}>
              <Text style={styles.muted}>Mechanism: </Text>
              {blueprint.positioning.offer.mechanism}
            </Text>
          ) : null}
          <Text style={styles.h3}>Proof points</Text>
          <BulletList items={blueprint.positioning.offer.proof_points} />
          <Text style={styles.h3}>Differenzierung</Text>
          <BulletList items={blueprint.positioning.offer.differentiation} />
        </View>

        <Text style={styles.h2}>Hero (Vorschlag)</Text>
        <View style={styles.card}>
          <Text style={styles.p}>
            <Text style={styles.muted}>Ziel: </Text>
            {blueprint.hero.goal}
          </Text>
          <Text style={styles.h3}>{blueprint.hero.structure.headline}</Text>
          <Text style={styles.p}>{blueprint.hero.structure.subheadline}</Text>
          <BulletList items={blueprint.hero.structure.bullets} />
          <Text style={styles.p}>
            <Text style={styles.muted}>Primary CTA: </Text>
            {blueprint.hero.structure.primary_cta.label}
          </Text>
          <Text style={styles.p}>
            <Text style={styles.muted}>Secondary CTA: </Text>
            {blueprint.hero.structure.secondary_cta.label}
          </Text>
        </View>
      </Page>

      {/* Roadmap */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>30-Tage Roadmap (Checkliste)</Text>

        {blueprint.roadmap_30d.map((phase) => (
          <View key={phase.phase} style={styles.card}>
            <Text style={styles.h3}>
              {phase.phase}: {phase.objective}
            </Text>

            {phase.tasks.map((t, i) => (
              <View key={i} style={{ marginTop: 8 }}>
                <View style={styles.row}>
                  <View style={styles.checkbox} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 700 }}>{t.title}</Text>
                    <Text style={[styles.p, styles.muted]}>
                      Impact: {t.impact} · Effort: {t.effort} · Owner: {t.owner}
                    </Text>
                  </View>
                </View>
                <Text style={styles.p}>{t.why_it_matters}</Text>
                <BulletList items={t.steps} />
                <Text style={styles.p}>
                  <Text style={styles.muted}>Deliverable: </Text>
                  {t.deliverable}
                </Text>
                <View style={styles.divider} />
              </View>
            ))}
          </View>
        ))}
      </Page>

      {/* Bonus prompts */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Bonus: KI Prompt Library</Text>
        <Text style={[styles.p, styles.muted]}>
          Optional: Diese Prompts kannst du in ChatGPT/Claude/etc. einfügen, um schneller umzusetzen.
        </Text>

        {blueprint.ai_prompt_library.map((p, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.h3}>{p.title}</Text>
            <Text style={[styles.p, styles.muted]}>{p.when_to_use}</Text>
            <Text style={styles.h3}>Inputs</Text>
            <BulletList items={p.inputs_needed} />
            <Text style={styles.h3}>Prompt</Text>
            <Text style={styles.p}>{p.prompt}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}