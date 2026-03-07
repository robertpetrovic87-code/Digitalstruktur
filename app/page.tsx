"use client";

import React, { useMemo, useState } from "react";
import EmailGateInline from "./components/EmailGateInline";

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

function getScoreBand(score: number) {
  if (score >= 80) return "80-100";
  if (score >= 60) return "60-79";
  if (score >= 40) return "40-59";
  return "<40";
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
    <div className="mx-auto my-6 max-w-6xl rounded-[28px] bg-gradient-to-b from-slate-50 to-[#f6f8fc] px-4 py-5 font-sans sm:my-8 sm:px-5 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <div className="mb-3 inline-flex items-center gap-2">
          <span className="rounded-full border border-indigo-200 bg-indigo-100/70 px-3 py-1 text-xs font-bold text-indigo-700">
            Beta
          </span>
          <span className="text-xs text-slate-500 sm:text-sm">
            Schnell. Direkt. Umsetzbar.
          </span>
        </div>

        <h1 className="m-0 max-w-3xl text-[42px] leading-[0.98] tracking-[-0.04em] text-slate-900 sm:text-5xl">
          AI Website Reality Check
        </h1>

        <p className="mt-4 max-w-3xl text-[18px] leading-8 text-slate-600 sm:text-lg">
          Erhalte eine schnelle und ehrliche Analyse deiner Website aus
          Conversion- und Messaging-Sicht.
          <br />
          Fokus auf <strong>Klarheit, Vertrauen und Handlungsstärke</strong> —
          ohne Tool-Overload und ohne SEO-Blabla.
        </p>
      </div>

      <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-4 py-5 shadow-[0_12px_40px_rgba(2,6,23,0.08)] sm:px-6 sm:py-6">
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_auto] md:items-end">
          <label className="grid gap-2 font-semibold text-slate-900">
            <span>Website URL</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://deine-website.de"
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <label className="grid gap-2 font-semibold text-slate-900">
            <span>Ziel</span>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 shadow-sm outline-none"
            >
              <option value="leads">Mehr Anfragen</option>
              <option value="sales">Mehr Verkäufe</option>
              <option value="branding">Besseres Branding</option>
            </select>
          </label>

          <button
            onClick={onAnalyze}
            disabled={loading || !canAnalyze}
            className={`min-h-14 w-full rounded-2xl px-5 py-4 text-base font-extrabold text-white transition md:w-auto md:whitespace-nowrap ${
              loading || !canAnalyze
                ? "cursor-not-allowed bg-slate-300"
                : "bg-indigo-600 shadow-[0_14px_30px_rgba(79,70,229,0.26)] hover:bg-indigo-700"
            }`}
          >
            {loading ? "Analysiere…" : "Analyse starten"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-slate-500">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
            kostenlos
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
            keine Anmeldung nötig
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
            Ergebnis in Sekunden
          </span>
        </div>

        {loading && (
          <div className="mt-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                style={{ animation: "loadingBar 1.1s ease-in-out infinite" }}
                className="h-full w-[40%] rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
              />
            </div>

            <p className="mt-3 text-slate-700">
              <strong>{loadingMessages[loadingStep]}</strong>
              <span className="text-slate-500"> (ca. 10–20 Sekunden)</span>
            </p>
          </div>
        )}

        {showDone && !loading && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-800">
            Analyse abgeschlossen ✅
          </div>
        )}

        {!canAnalyze && url.length > 0 && (
          <p className="m-0 text-sm text-red-700">
            Bitte gib eine gültige URL ein (mit https://).
          </p>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800">
            <strong className="mb-1 block">Konnte nicht analysieren</strong>
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && (
        <section className="mt-6 grid gap-4 sm:mt-8 sm:gap-5">
          <div className="grid gap-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(2,6,23,0.06)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-2xl font-bold text-slate-900 sm:text-3xl">
                  Score: {overallScore}/100
                </h2>
                <p className="mt-3 max-w-2xl text-slate-600 leading-7">
                  {summary || "Bitte Analyse erneut starten, falls die Zusammenfassung fehlt."}
                </p>
              </div>

              <div className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-extrabold text-indigo-700">
                Score-Bereich: {activeBand}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-2">
                {[
                  { key: "80-100", label: "80–100", text: "Sehr stark – Feinschliff & Skalierung." },
                  { key: "60-79", label: "60–79", text: "Gute Basis – klare Hebel für mehr Wirkung." },
                  { key: "40-59", label: "40–59", text: "Potenzial – Kernbotschaft & Struktur nachschärfen." },
                  { key: "<40", label: "<40", text: "Bremst stark – Angebot, CTA und Vertrauen erst klarziehen." },
                ].map((r) => {
                  const active = r.key === activeBand;
                  return (
                    <div
                      key={r.key}
                      className={`grid items-center gap-3 rounded-2xl px-4 py-3 text-sm sm:grid-cols-[72px_1fr] ${
                        active
                          ? "border border-indigo-300 bg-indigo-50 font-bold text-slate-900"
                          : "border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <span>{r.label}</span>
                      <span>{r.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(categoryScoresObj).length === 0 ? (
                <div className="text-sm text-red-700">
                  Hinweis: Kategorie-Scores fehlen im AI-Output. Bitte Analyse erneut starten.
                </div>
              ) : (
                Object.entries(categoryScoresObj).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-1 text-xs capitalize text-slate-500">{k}</div>
                    <div className="text-2xl font-extrabold text-slate-900">
                      {safeNumber(v)}/20
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(2,6,23,0.06)] sm:p-6">
              <h3 className="mb-4 mt-0 text-xl font-bold text-slate-900">
                Was funktioniert
              </h3>

              {strengths.length ? (
                <div className="grid gap-3">
                  {strengths.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700 leading-7"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-700">Keine Strengths im Output.</p>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(2,6,23,0.06)] sm:p-6">
              <h3 className="mb-4 mt-0 text-xl font-bold text-slate-900">
                Was bremst
              </h3>

              {blockers.length ? (
                <div className="grid gap-3">
                  {blockers.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-900 leading-7"
                    >
                      {b}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-700">Keine Blocker im Output.</p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(2,6,23,0.06)] sm:p-6">
            <h3 className="mb-2 mt-0 text-xl font-bold text-slate-900">
              Quick Wins (15 Min)
            </h3>

            <p className="mb-0 text-slate-600 leading-7">
              Kleine Änderungen, die du schnell umsetzen kannst und die oft direkt
              spürbar etwas verbessern.
            </p>

            {quickWins.length ? (
              <div className="mt-4 grid gap-3">
                {quickWins.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mt-2 h-2.5 w-2.5 min-w-2.5 rounded-full bg-slate-900" />
                    <div className="text-slate-700 leading-7">
                      <strong className="text-slate-900">{q.title}:</strong> {q.how}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-red-700">Keine Quick Wins im Output.</p>
            )}

            <EmailGateInline websiteUrl={url} reportId={reportId} />

            <p className="mt-4 text-xs leading-6 text-slate-500">
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
      `}</style>
    </div>
  );
}