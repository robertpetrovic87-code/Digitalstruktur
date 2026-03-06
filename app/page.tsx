"use client";

import React, { useMemo, useState } from "react";
import EmailGateInline from "./components/EmailGateInline";

const UI = {
  bg: "#f6f8fc",
  card: "#ffffff",
  border: "#e5e7eb",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#4f46e5",
  primaryDark: "#4338ca",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#065f46",
  dangerBg: "#fff1f2",
  dangerBorder: "#fecdd3",
  dangerText: "#9f1239",
  shadow: "0 12px 40px rgba(2, 6, 23, 0.08)",
};

type Goal = "leads" | "sales" | "branding";

type AuditResult = {
  overallScore: number;
  goal: Goal;
  categoryScores?: {
    clarity?: number;
    audienceFit?: number;
    trust?: number;
    conversion?: number;
    structure?: number;
  };
  strengths?: string[];
  blockers?: string[];
  quickWins?: { title: string; how: string }[];
  detailedReport?: {
    clarity?: string;
    audienceFit?: string;
    trust?: string;
    conversion?: string;
    structure?: string;
  };
  summary?: string;
  disclaimer?: string;
};

type AnalyzeSuccess = { reportId: string; result: AuditResult };
type AnalyzeError = { error: string };

function isAnalyzeSuccess(data: unknown): data is AnalyzeSuccess {
  if (typeof data !== "object" || data === null) return false;
  const c = data as { reportId?: unknown; result?: unknown };
  return (
    typeof c.reportId === "string" &&
    c.reportId.trim().length > 0 &&
    typeof c.result === "object" &&
    c.result !== null
  );
}

function getScoreBand(score: number) {
  if (score >= 80) return "80-100";
  if (score >= 60) return "60-79";
  if (score >= 40) return "40-59";
  return "<40";
}

function bandRowStyle(active: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "72px 1fr",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: 14,
    background: active ? "#eef2ff" : "#f8fafc",
    border: active ? "1px solid #a5b4fc" : "1px solid #e5e7eb",
    fontWeight: active ? 700 : 500,
    color: "#0f172a",
  };
}

function safeNumber(n: unknown, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function safeString(s: unknown, fallback = ""): string {
  return typeof s === "string" ? s : fallback;
}

function safeStringArray(a: unknown, fallback: string[] = []): string[] {
  return Array.isArray(a) && a.every((x) => typeof x === "string") ? a : fallback;
}

function safeQuickWins(a: unknown): { title: string; how: string }[] {
  if (!Array.isArray(a)) return [];
  const out: { title: string; how: string }[] = [];
  for (const item of a) {
    if (typeof item !== "object" || item === null) continue;
    const c = item as { title?: unknown; how?: unknown };
    const title = safeString(c.title).trim();
    const how = safeString(c.how).trim();
    if (title && how) out.push({ title, how });
  }
  return out;
}

function cardStyle(): React.CSSProperties {
  return {
    padding: 22,
    borderRadius: 22,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 40px rgba(2,6,23,0.06)",
  };
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [goal, setGoal] = useState<Goal>("leads");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const loadingMessages = [
    "Analysiere Klarheit…",
    "Prüfe Zielgruppen-Fit…",
    "Bewerte Vertrauen…",
    "Checke Conversion & CTA…",
    "Ordne Struktur & Scanbarkeit…",
  ] as const;

  const canAnalyze = useMemo(() => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  async function onAnalyze() {
    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);
    setReportId(null);

    const interval = setInterval(() => {
      setLoadingStep((s) => (s < loadingMessages.length - 1 ? s + 1 : s));
    }, 900);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, goal }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as AnalyzeError).error === "string"
            ? (data as AnalyzeError).error
            : "Analyse fehlgeschlagen.";
        throw new Error(msg);
      }

      if (!isAnalyzeSuccess(data)) {
        throw new Error("Analyse-Antwort ungültig (reportId/result fehlt).");
      }

      setResult(data.result);
      setReportId(data.reportId);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unbekannter Fehler";
      setError(message);
    } finally {
      clearInterval(interval);
      setShowDone(true);
      setTimeout(() => setShowDone(false), 1200);
      setLoading(false);
    }
  }

  const overallScore = safeNumber(result?.overallScore, 0);
  const activeBand = getScoreBand(overallScore);

  const categoryScoresObj =
    (result?.categoryScores && typeof result.categoryScores === "object"
      ? result.categoryScores
      : undefined) ?? {};

  const strengths = safeStringArray(result?.strengths, []);
  const blockers = safeStringArray(result?.blockers, []);
  const quickWins = safeQuickWins(result?.quickWins);
  const summary = safeString(result?.summary, "");
  const disclaimer = safeString(result?.disclaimer, "");

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "32px auto",
        padding: 18,
        fontFamily: "system-ui, sans-serif",
        background: "linear-gradient(to bottom, #f8fafc, #f6f8fc)",
        borderRadius: 28,
      }}
    >
      {/* Hero */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <span
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(79,70,229,0.12)",
              color: "#4338ca",
              border: "1px solid rgba(79,70,229,0.18)",
              fontWeight: 700,
            }}
          >
            Beta
          </span>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Schnell. Direkt. Umsetzbar.
          </span>
        </div>

        <h1
          style={{
            fontSize: 40,
            lineHeight: 1.1,
            margin: 0,
            color: "#0f172a",
            letterSpacing: -1,
          }}
        >
          AI Website Reality Check
        </h1>

        <p
          style={{
            color: "#475569",
            marginTop: 14,
            lineHeight: 1.7,
            marginBottom: 0,
            fontSize: 17,
            maxWidth: 760,
          }}
        >
          Erhalte eine schnelle und ehrliche Analyse deiner Website aus
          Conversion- und Messaging-Sicht.
          <br />
          Fokus auf <strong>Klarheit, Vertrauen und Handlungsstärke</strong> —
          ohne Tool-Overload und ohne SEO-Blabla.
        </p>
      </div>

      {/* Input Card */}
      <div
        style={{
          ...cardStyle(),
          display: "grid",
          gap: 16,
          padding: 24,
          background: "linear-gradient(180deg, #ffffff 0%, #fafbff 100%)",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "1.4fr 0.8fr auto",
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: 8, fontWeight: 600, color: "#0f172a" }}>
            <span>Website URL</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://deine-website.de"
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px 18px",
                borderRadius: 18,
                border: "1px solid #dbe3ee",
                background: "#ffffff",
                color: "#111827",
                outline: "none",
                fontSize: 16,
                boxShadow: "0 8px 24px rgba(2, 6, 23, 0.04)",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 8, fontWeight: 600, color: "#0f172a" }}>
            <span>Ziel</span>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px 14px",
                borderRadius: 18,
                border: "1px solid #dbe3ee",
                background: loading ? "#f1f5f9" : "#ffffff",
                color: "#0f172a",
                outline: "none",
                fontSize: 16,
                boxShadow: "0 8px 24px rgba(2, 6, 23, 0.04)",
              }}
            >
              <option value="leads">Mehr Anfragen</option>
              <option value="sales">Mehr Verkäufe</option>
              <option value="branding">Besseres Branding</option>
            </select>
          </label>

          <button
            onClick={onAnalyze}
            disabled={loading || !canAnalyze}
            style={{
              padding: "16px 22px",
              minHeight: 56,
              borderRadius: 18,
              border: "1px solid transparent",
              background: loading || !canAnalyze ? "#cbd5e1" : UI.primary,
              color: "white",
              cursor: loading || !canAnalyze ? "not-allowed" : "pointer",
              fontWeight: 800,
              fontSize: 16,
              boxShadow: loading || !canAnalyze ? "none" : "0 14px 30px rgba(79,70,229,0.26)",
              transition: "all .18s ease",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Analysiere…" : "Analyse starten"}
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, color: "#64748b", fontSize: 13 }}>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            kostenlos
          </span>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            keine Anmeldung nötig
          </span>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            Ergebnis in Sekunden
          </span>
        </div>

        {loading && (
          <div style={{ marginTop: 4 }}>
            <div
              style={{
                height: 10,
                width: "100%",
                background: "#eef2f7",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "40%",
                  background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                  borderRadius: 999,
                  animation: "loadingBar 1.1s ease-in-out infinite",
                }}
              />
            </div>

            <p style={{ marginTop: 12, color: "#334155" }}>
              <strong>{loadingMessages[loadingStep]}</strong>
              <span style={{ color: "#64748b" }}> (ca. 10–20 Sekunden)</span>
            </p>
          </div>
        )}

        {showDone && !loading && (
          <div
            style={{
              marginTop: 4,
              padding: 12,
              borderRadius: 14,
              background: "#eefbf3",
              border: "1px solid #b7e4c7",
              color: "#14532d",
              fontWeight: 700,
            }}
          >
            Analyse abgeschlossen ✅
          </div>
        )}

        {!canAnalyze && url.length > 0 && (
          <p style={{ color: "#b00", margin: 0 }}>
            Bitte gib eine gültige URL ein (mit https://).
          </p>
        )}

        {error && (
          <div
            style={{
              marginTop: 4,
              padding: 14,
              borderRadius: 14,
              border: "1px solid #f1c0c7",
              background: "#fff5f7",
              color: "#7a1f2b",
            }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>
              Konnte nicht analysieren
            </strong>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <section style={{ marginTop: 24, display: "grid", gap: 18 }}>
          {/* Score Card */}
          <div
            style={{
              ...cardStyle(),
              display: "grid",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>
                  Score: {overallScore}/100
                </h2>
                <p style={{ marginTop: 10, marginBottom: 0, color: "#475569", lineHeight: 1.6 }}>
                  {summary || "Bitte Analyse erneut starten, falls die Zusammenfassung fehlt."}
                </p>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "#eef2ff",
                  color: "#4338ca",
                  fontWeight: 800,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                }}
              >
                Score-Bereich: {activeBand}
              </div>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: "#fafafa",
                border: "1px solid #ececec",
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { key: "80-100", label: "80–100", text: "Sehr stark – Feinschliff & Skalierung." },
                  { key: "60-79", label: "60–79", text: "Gute Basis – klare Hebel für mehr Wirkung." },
                  { key: "40-59", label: "40–59", text: "Potenzial – Kernbotschaft & Struktur nachschärfen." },
                  { key: "<40", label: "<40", text: "Bremst stark – Angebot, CTA und Vertrauen erst klarziehen." },
                ].map((r) => {
                  const active = r.key === activeBand;
                  return (
                    <div key={r.key} style={bandRowStyle(active)}>
                      <span style={{ minWidth: 64 }}>{r.label}</span>
                      <span style={{ opacity: active ? 1 : 0.92 }}>{r.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {Object.entries(categoryScoresObj).length === 0 ? (
                <div style={{ fontSize: 12, color: "#b00" }}>
                  Hinweis: Kategorie-Scores fehlen im AI-Output. Bitte Analyse erneut starten.
                </div>
              ) : (
                Object.entries(categoryScoresObj).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      border: "1px solid #eceff3",
                      background: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        textTransform: "capitalize",
                        marginBottom: 6,
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                      {safeNumber(v)}/20
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Strengths / Blockers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <div style={cardStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 14, color: "#0f172a" }}>
                Was funktioniert
              </h3>

              {strengths.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {strengths.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        color: "#334155",
                        lineHeight: 1.6,
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#b00" }}>Keine Strengths im Output.</p>
              )}
            </div>

            <div style={cardStyle()}>
              <h3 style={{ marginTop: 0, marginBottom: 14, color: "#0f172a" }}>
                Was bremst
              </h3>

              {blockers.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {blockers.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#7c2d12",
                        lineHeight: 1.6,
                      }}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#b00" }}>Keine Blocker im Output.</p>
              )}
            </div>
          </div>

          {/* Quick Wins */}
          <div style={cardStyle()}>
            <h3 style={{ marginTop: 0, marginBottom: 10, color: "#0f172a" }}>
              Quick Wins (15 Min)
            </h3>

            <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.6 }}>
              Kleine Änderungen, die du schnell umsetzen kannst und die oft direkt
              spürbar etwas verbessern.
            </p>

            {quickWins.length ? (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {quickWins.map((q, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: 16,
                      borderRadius: 16,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        minWidth: 10,
                        borderRadius: 999,
                        background: "#111827",
                        marginTop: 7,
                      }}
                    />
                    <div style={{ color: "#334155", lineHeight: 1.7 }}>
                      <strong style={{ color: "#0f172a" }}>{q.title}:</strong> {q.how}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#b00" }}>Keine Quick Wins im Output.</p>
            )}

            <EmailGateInline websiteUrl={url} reportId={reportId} />

            <p style={{ fontSize: 12, color: "#666", marginTop: 14 }}>
              {disclaimer ||
                "Hinweis: AI-Ausgabe kann unvollständig sein. Bitte erneut testen, falls Felder fehlen."}
            </p>
          </div>
        </section>
      )}

      <style jsx global>{`
        @keyframes loadingBar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(60%);
          }
          100% {
            transform: translateX(180%);
          }
        }

        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1.4fr 0.8fr auto"] {
            grid-template-columns: 1fr !important;
          }

          div[style*="grid-template-columns: repeat(5, minmax(0, 1fr))"] {
            grid-template-columns: 1fr 1fr !important;
          }

          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(5, minmax(0, 1fr))"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}