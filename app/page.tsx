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

function getCategoryLabel(key: string) {
  const labels: Record<string, string> = {
    clarity: "Klarheit",
    audienceFit: "Zielgruppen-Fit",
    trust: "Vertrauen",
    conversion: "Conversion",
    structure: "Struktur",
  };
  return labels[key] ?? key;
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-[#f6f8fc]">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl border border-slate-200/70 bg-white/85 p-3 shadow-[0_20px_60px_rgba(2,6,23,0.06)] sm:p-4 lg:p-5">
          <div className="border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/70 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            <section className="mx-auto max-w-5xl">
              <div className="mb-8 sm:mb-10">
                <div className="mb-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="border border-indigo-200 bg-indigo-100/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-indigo-700">
                    Beta
                  </span>
                  <span className="text-sm text-slate-500">
                    Schnell. Direkt. Umsetzbar.
                  </span>
                </div>

                <div className="max-w-2xl text-left">
                  <h1 className="text-[1.95rem] font-black leading-[0.98] tracking-[-0.05em] text-slate-900 sm:text-5xl lg:text-[4rem]">
                    AI Website
                    <span className="block">Reality Check</span>
                  </h1>

                  <p className="mt-4 max-w-xl text-[0.98rem] leading-7 text-slate-600 sm:text-lg sm:leading-8">
                    Erhalte eine schnelle und ehrliche Analyse deiner Website aus
                    Conversion- und Messaging-Sicht. Fokus auf{" "}
                    <strong>Klarheit, Vertrauen und Handlungsstärke</strong> —
                    ohne Tool-Overload und ohne SEO-Blabla.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-start">
                <div className="border border-slate-200 bg-white px-4 py-5 shadow-[0_10px_30px_rgba(2,6,23,0.06)] sm:px-6 sm:py-6 lg:px-7 lg:py-7">
                  <div className="grid gap-5">
                    <div className="border-b border-slate-100 pb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
    Website prüfen
                    </p>
                    </div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Website analysieren
                    </div>

                    <label className="grid gap-2 text-left">
                    <span className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                       Website URL eingeben
                    </span>
                      <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://deine-website.de"
                        disabled={loading}
                        className="w-full border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      />
                    </label>

                    <label className="grid gap-2 text-left">
                      <span className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                        Ziel
                      </span>
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value as Goal)}
                        disabled={loading}
                        className="w-full border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      >
                        <option value="leads">Mehr Anfragen</option>
                        <option value="sales">Mehr Verkäufe</option>
                        <option value="branding">Besseres Branding</option>
                      </select>
                    </label>

                    <button
                      onClick={onAnalyze}
                      disabled={loading || !canAnalyze}
                      className={`mt-3 min-h-[56px] w-full rounded-2xl px-6 py-4 text-base font-extrabold text-white transition ${
                        loading || !canAnalyze
                          ? "cursor-not-allowed bg-slate-300"
                          : "bg-indigo-600 shadow-[0_14px_30px_rgba(79,70,229,0.24)] hover:bg-indigo-700"
                      }`}
                    >
                      {loading ? "Analysiere…" : "Website jetzt analysieren"}
                    </button>
                  </div>

                  <div className="mt-3 text-center text-sm font-semibold text-slate-600">
                   Kostenlos • Keine Anmeldung • Ergebnis in Sekunden
                  </div>

                  {loading && (
                    <div className="mt-6 border border-slate-200 bg-slate-50 p-4">
                      <div className="h-2.5 w-full overflow-hidden bg-slate-200">
                        <div
                          style={{ animation: "loadingBar 1.1s ease-in-out infinite" }}
                          className="h-full w-[40%] bg-gradient-to-r from-indigo-600 to-violet-600"
                        />
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
                        <strong>{loadingMessages[loadingStep]}</strong>
                        <span className="text-slate-500"> (ca. 10–20 Sekunden)</span>
                      </p>
                    </div>
                  )}

                  {showDone && !loading && (
                    <div className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-center font-bold text-emerald-800">
                      Analyse abgeschlossen ✅
                    </div>
                  )}

                  {!canAnalyze && url.length > 0 && (
                    <p className="mt-4 text-sm text-red-700">
                      Bitte gib eine gültige URL ein (mit https://).
                    </p>
                  )}

                  {error && (
                    <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800">
                      <strong className="mb-1 block">Konnte nicht analysieren</strong>
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <aside className="border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-[0_10px_30px_rgba(2,6,23,0.05)]">
                  <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Das bekommst du
                    </p>
                    <h3 className="mt-2 text-[1.2rem] font-bold leading-snug text-slate-900 sm:text-xl">
                      Ein schneller Blick auf die größten Hebel deiner Website
                    </h3>
                  </div>

                  <div className="grid gap-3 px-4 py-4 sm:px-5 sm:py-5">
                    {[
                      "Klarheit deiner Botschaft",
                      "Vertrauen & erste Wirkung",
                      "CTA und Conversion-Potenzial",
                      "konkrete Quick Wins in 15 Minuten",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="mt-1.5 h-2.5 w-2.5 min-w-2.5 rounded-full bg-indigo-600" />
                        <p className="text-sm leading-6 text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>

                  
                </aside>
              </div>
            </section>

            {result && (
              <section className="mt-8 grid gap-5 sm:mt-10">
                <div className="border border-slate-200 bg-white shadow-[0_12px_40px_rgba(2,6,23,0.06)]">
                  <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-5 sm:px-6 sm:py-6 lg:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-3xl">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Analyse-Ergebnis
                        </p>
                        <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">
                          Score: {overallScore}/100
                        </h2>
                        <p className="mt-3 text-base leading-7 text-slate-600 sm:text-[17px]">
                          {summary ||
                            "Bitte Analyse erneut starten, falls die Zusammenfassung fehlt."}
                        </p>
                      </div>

                      <div className="inline-flex items-center border border-indigo-200 bg-indigo-100 px-4 py-2 text-sm font-extrabold text-indigo-700">
                        Score-Bereich: {activeBand}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-5 sm:px-6 sm:py-6 lg:px-7">
                    <div className="border border-slate-200 bg-slate-50 p-3 sm:p-4">
                      <div className="grid gap-2">
                        {[
                          {
                            key: "80-100",
                            label: "80–100",
                            text: "Sehr stark – Feinschliff & Skalierung.",
                          },
                          {
                            key: "60-79",
                            label: "60–79",
                            text: "Gute Basis – klare Hebel für mehr Wirkung.",
                          },
                          {
                            key: "40-59",
                            label: "40–59",
                            text: "Potenzial – Kernbotschaft & Struktur nachschärfen.",
                          },
                          {
                            key: "<40",
                            label: "<40",
                            text: "Bremst stark – Angebot, CTA und Vertrauen erst klarziehen.",
                          },
                        ].map((r) => {
                          const active = r.key === activeBand;
                          return (
                            <div
                              key={r.key}
                              className={`grid gap-2 px-4 py-3 text-sm sm:grid-cols-[82px_1fr] sm:items-center ${
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

                    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                      {Object.entries(categoryScoresObj).length === 0 ? (
                        <div className="text-sm text-red-700">
                          Hinweis: Kategorie-Scores fehlen im AI-Output. Bitte Analyse erneut starten.
                        </div>
                      ) : (
                        Object.entries(categoryScoresObj).map(([k, v]) => (
                          <div
                            key={k}
                            className="border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="text-xs font-medium text-slate-500">
                              {getCategoryLabel(k)}
                            </div>
                            <div className="mt-2 text-2xl font-extrabold text-slate-900">
                              {safeNumber(v)}/20
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <div className="border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.05)] sm:p-6 lg:p-7">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100" />
                      <h3 className="text-xl font-bold text-slate-900">
                        Was funktioniert
                      </h3>
                    </div>

                    {strengths.length ? (
                      <div className="grid gap-3">
                        {strengths.map((s, i) => (
                          <div
                            key={i}
                            className="border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 sm:text-[15px]"
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-700">Keine Strengths im Output.</p>
                    )}
                  </div>

                  <div className="border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,0.05)] sm:p-6 lg:p-7">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-9 w-9 bg-orange-100" />
                      <h3 className="text-xl font-bold text-slate-900">
                        Was bremst
                      </h3>
                    </div>

                    {blockers.length ? (
                      <div className="grid gap-3">
                        {blockers.map((b, i) => (
                          <div
                            key={i}
                            className="border border-orange-200 bg-orange-50 p-4 text-sm leading-7 text-orange-900 sm:text-[15px]"
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

                <div className="border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(2,6,23,0.06)] sm:p-6 lg:p-7">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Sofort umsetzbar
                    </p>
                    <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-900">
                      Quick Wins (15 Min)
                    </h3>

                    <p className="mt-3 text-slate-600 leading-7">
                      Kleine Änderungen, die du schnell umsetzen kannst und die oft
                      direkt spürbar etwas verbessern.
                    </p>
                  </div>

                  {quickWins.length ? (
                    <div className="mt-5 grid gap-3">
                      {quickWins.map((q, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="mt-2 h-2.5 w-2.5 min-w-2.5 rounded-full bg-slate-900" />
                          <div className="text-sm leading-7 text-slate-700 sm:text-[15px]">
                            <strong className="text-slate-900">{q.title}:</strong> {q.how}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-red-700">Keine Quick Wins im Output.</p>
                  )}

                  <div className="mt-6 border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                    <EmailGateInline websiteUrl={url} reportId={reportId} />
                  </div>

                  <p className="mt-5 text-xs leading-6 text-slate-500">
                    {disclaimer ||
                      "Hinweis: AI-Ausgabe kann unvollständig sein. Bitte erneut testen, falls Felder fehlen."}
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

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
    </main>
  );
}