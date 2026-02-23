"use client";

import React, { useMemo, useState } from "react";
import EmailGateInline from "./components/EmailGateInline";

const UI = {
  bg: "#f6f8fc",
  card: "#ffffff",
  border: "#e5e7eb",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#4f46e5", // indigo
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
  overallScore: number; // 0-100
  goal: Goal;
  categoryScores: {
    clarity: number; // 0-20
    audienceFit: number; // 0-20
    trust: number; // 0-20
    conversion: number; // 0-20
    structure: number; // 0-20
  };
  strengths: string[]; // 3
  blockers: string[]; // 3
  quickWins: { title: string; how: string }[]; // 2-3
  detailedReport: {
    clarity: string;
    audienceFit: string;
    trust: string;
    conversion: string;
    structure: string;
  };
  summary: string;
  disclaimer: string;
};

type AnalyzeSuccess = { reportId: string; result: AuditResult };
type AnalyzeError = { error: string };
type AnalyzeResponse = AnalyzeSuccess | AnalyzeError;

function isAnalyzeSuccess(data: unknown): data is AnalyzeSuccess {
  if (typeof data !== "object" || data === null) return false;
  const c = data as { reportId?: unknown; result?: unknown };
  return typeof c.reportId === "string" && c.reportId.trim().length > 0 && typeof c.result === "object" && c.result !== null;
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
    padding: "10px 12px",
    borderRadius: 12,
    background: active ? "#eef2ff" : "#f8fafc",
    border: active ? "1px solid #a5b4fc" : "1px solid #e5e7eb",
    fontWeight: active ? 700 : 500,
    color: "#0f172a",
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
      // eslint-disable-next-line no-new
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  async function onAnalyze() {
    setLoading(true);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((s) => (s < loadingMessages.length - 1 ? s + 1 : s));
    }, 900);

    setError(null);
    setResult(null);
    setReportId(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, goal }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          typeof data === "object" && data !== null && "error" in data && typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
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

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "32px auto",
        padding: 18,
        fontFamily: "system-ui",
        background: "f6f8fc",
        borderRadius: 24,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "inline-flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
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
          <span style={{ fontSize: 12, color: "#64748b" }}>Schnell. Direkt. Umsetzbar.</span>
        </div>

        <h1 style={{ fontSize: 34, margin: 0, color: "#0f172a", letterSpacing: -0.6 }}>
          AI Website Reality Check
        </h1>

        <p style={{ color: "#475569", marginTop: 10, lineHeight: 1.6, marginBottom: 0 }}>
          <strong>Schnelle, ehrliche Analyse</strong> deiner Website aus Conversion- & Messaging-Sicht.
          <br />
          Kein SEO-Tool. Kein Design-Check. Fokus auf <strong>Klarheit, Vertrauen und Handlungsstärke</strong>.
        </p>
      </div>

      {/* Input Card */}
      <div style={{ display: "grid", gap: 12, padding: 16, border: "1px solid #eee", borderRadius: 14 }}>
        <label>
          Website URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            disabled={loading}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              marginTop: 6,
              background: UI.card,
              boxShadow: UI.shadow,
              color: "#111827",
              outline: "none",
            }}
          />
        </label>

        <label>
          Ziel
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              marginTop: 6,
              background: loading ? "#f1f5f9" : "ffffff",
              color: "0f172a",
              outline: "none",
            }}
          >
            <option value="leads">Mehr Anfragen (Leads)</option>
            <option value="sales">Mehr Verkäufe</option>
            <option value="branding">Besseres Branding</option>
          </select>
        </label>

        <button
          onClick={onAnalyze}
          disabled={loading || !canAnalyze}
          style={{
            padding: 12,
            borderRadius: 14,
            border: `1px solid ${UI.border}`,
            background: loading || !canAnalyze ? "#cbd5e1" : UI.primary,
            color: "white",
            cursor: loading || !canAnalyze ? "not-allowed" : "pointer",
            fontWeight: 750,
            boxShadow: loading || !canAnalyze ? "none" : "0 10px 20px rgba(79,70,229,0.25)",
          }}
        >
          {loading ? "Analysiere…" : "Analyse starten"}
        </button>

        {loading && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                height: 10,
                width: "100%",
                background: "#f6f8fc",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "40%",
                  background: "#111",
                  borderRadius: 999,
                  animation: "loadingBar 1.1s ease-in-out infinite",
                }}
              />
            </div>

            <p style={{ marginTop: 10, color: "#444" }}>
              <strong>{loadingMessages[loadingStep]}</strong>
              <span style={{ color: "#777" }}> (ca. 10–20 Sekunden)</span>
            </p>
          </div>
        )}

        {showDone && !loading && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 10,
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
          <p style={{ color: "#b00" }}>Bitte gib eine gültige URL ein (mit https://).</p>
        )}

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 12,
              border: "1px solid #f1c0c7",
              background: "#fff5f7",
              color: "#7a1f2b",
            }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>Konnte nicht analysieren</strong>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <section style={{ marginTop: 22, display: "grid", gap: 16 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 20,
              boxShadow: "0 12px 40px rgba(2,6,23,0.06)",
              display: "grid",
              gap: 14,
            }}
          >
            <h2 style={{ margin: 0 }}>Score: {result.overallScore}/100</h2>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>{result.summary}</p>

            {/* Score Erklärung */}
            {(() => {
              const activeBand = getScoreBand(result.overallScore);
              const rows = [
                { key: "80-100", label: "80–100", text: "Sehr stark – Feinschliff & Skalierung." },
                { key: "60-79", label: "60–79", text: "Gute Basis – klare Hebel für mehr Wirkung." },
                { key: "40-59", label: "40–59", text: "Potenzial – Kernbotschaft & Struktur nachschärfen." },
                { key: "<40", label: "<40", text: "Bremst stark – Angebot/CTA/Vertrauen erst klarziehen." },
              ] as const;

              return (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 14,
                    background: "#fafafa",
                    border: "1px solid #eee",
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: "#333",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ margin: 0 }}>Score</h2>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "#eef2ff",
                        color: "#4338ca",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {result.overallScore}/100
                    </div>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      Aktuell: <strong>{activeBand}</strong>
                    </span>
                  </div>

                  <div
                    style={{
                      background: UI.bg,
                      borderRadius: 24,
                      padding: 20,
                      minHeight: "auto",
                    }}
                  />

                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    {rows.map((r) => {
                      const active = r.key === activeBand;
                      return (
                        <div key={r.key} style={bandRowStyle(active)}>
                          <span style={{ minWidth: 64 }}>{r.label}</span>
                          <span style={{ opacity: active ? 1 : 0.9 }}>{r.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Category Scores */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              {Object.entries(result.categoryScores).map(([k, v]) => (
                <div key={k} style={{ padding: 10, borderRadius: 12, border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 12, color: "#666" }}>{k}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{v}/20</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div
              style={{
                padding: 20,
                borderRadius: 18,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 12px 40px rgba(2,6,23,0.06)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Was funktioniert</h3>
              <ul>{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 18,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 12px 40px rgba(2,6,23,0.06)",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Was bremst</h3>
              <ul>{result.blockers.map((b, i) => <li key={i}>{b}</li>)}</ul>
            </div>
          </div>

          <div
            style={{
              padding: 20,
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              background: "#ffffff",
              boxShadow: "0 12px 40px rgba(2,6,23,0.06)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Quick Wins (15 Min)</h3>
            <ul>
              {result.quickWins.map((q, i) => (
                <li key={i}>
                  <strong>{q.title}:</strong> {q.how}
                </li>
              ))}
            </ul>

            {/* ✅ WICHTIG: reportId wird jetzt übergeben */}
            <EmailGateInline websiteUrl={url} reportId={reportId} />

            <p style={{ fontSize: 12, color: "#666", marginTop: 12 }}>{result.disclaimer}</p>
          </div>
        </section>
      )}
    </main>
  );
}