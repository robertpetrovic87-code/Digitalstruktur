"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BlueprintClient() {
  const searchParams = useSearchParams();
  const rid = useMemo(() => searchParams.get("rid") ?? "", [searchParams]);
  const canceled = searchParams.get("canceled") === "1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!rid) {
      setError("Report ID fehlt. Bitte öffne den Link erneut aus deiner Analyse-Mail.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId: rid }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Checkout konnte nicht gestartet werden.");
        setLoading(false);
        return;
      }

      if (!data?.url) {
        setError("Stripe Checkout URL fehlt.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("Es ist ein Fehler aufgetreten. Bitte versuche es erneut.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-zinc-50/50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-8 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_380px] lg:items-start">
          {/* LEFT */}
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm">
              Individueller Website Blueprint
            </div>

            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
                Dein klarer 30-Tage Plan für eine Website, die mehr Anfragen bringt
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
                Erhalte einen konkreten Umsetzungsplan, der dir zeigt, welche
                Änderungen auf deiner Website die größte Wirkung haben —
                individuell für dich erstellt, statt generisch automatisch erzeugt.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm">
                  Individuell für dich erstellt
                </span>
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm">
                  In 24 Stunden per E-Mail
                </span>
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm">
                  Klare nächste Schritte statt Theorie
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-zinc-900">
                  Was du bekommst
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
                  <li>✓ 30-Tage Umsetzungsplan mit klaren Prioritäten</li>
                  <li>✓ Conversion-Verbesserungen für mehr Anfragen</li>
                  <li>✓ Struktur-Optimierungen für bessere Nutzerführung</li>
                  <li>✓ SEO- und Content-Ideen mit Fokus auf Sichtbarkeit</li>
                  <li>✓ AI Prompts für bessere Texte und Seiteninhalte</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-zinc-900">
                  Besonders hilfreich, wenn du
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
                  <li>✓ mehr Leads über deine Website gewinnen willst</li>
                  <li>✓ nicht weißt, was du zuerst verbessern sollst</li>
                  <li>✓ einen klaren Plan statt Bauchgefühl willst</li>
                  <li>✓ schneller umsetzen statt ewig analysieren möchtest</li>
                  <li>✓ Fokus auf Wirkung statt Spielereien willst</li>
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-zinc-900">
                Warum dieser Blueprint wertvoll ist
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
                Viele Websites verlieren Anfragen nicht wegen eines einzigen großen
                Fehlers, sondern wegen vieler kleiner Reibungspunkte: unklare
                Struktur, schwache CTAs, zu wenig Vertrauen, unpräzise Texte oder
                fehlender Fokus. Genau hier setzt dein Blueprint an — mit
                konkreten Empfehlungen, die du direkt umsetzen kannst.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="text-sm font-semibold text-zinc-900">
                  Vorschau: So kann dein Blueprint aussehen
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  Kein generischer Report, sondern ein klarer Plan mit Prioritäten
                  und konkreten Umsetzungsschritten.
                </p>
              </div>

              <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Woche 1
                  </div>
                  <div className="mt-2 text-base font-semibold text-zinc-900">
                    Struktur verbessern
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-700">
                    <li>• Hero klarer auf Nutzen ausrichten</li>
                    <li>• wichtigste CTA prominenter platzieren</li>
                    <li>• Navigation vereinfachen</li>
                    <li>• Fokus pro Seite schärfen</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Woche 2
                  </div>
                  <div className="mt-2 text-base font-semibold text-zinc-900">
                    Conversion erhöhen
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-700">
                    <li>• Vertrauen sichtbarer machen</li>
                    <li>• Angebot klarer kommunizieren</li>
                    <li>• Formulare vereinfachen</li>
                    <li>• mehr Klicks auf die Hauptaktion lenken</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Woche 3
                  </div>
                  <div className="mt-2 text-base font-semibold text-zinc-900">
                    Sichtbarkeit aufbauen
                  </div>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-700">
                    <li>• wichtige Unterseiten definieren</li>
                    <li>• Content-Struktur verbessern</li>
                    <li>• SEO-Ideen priorisieren</li>
                    <li>• interne Verlinkung klarer aufbauen</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white shadow-sm">
              <div className="text-sm font-semibold text-zinc-300">
                Warum sich das lohnen kann
              </div>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-100">
                Wenn deine Website dadurch nur eine zusätzliche passende Anfrage
                oder einen einzigen zusätzlichen Kunden gewinnt, kann sich dieser
                Blueprint bereits sehr schnell bezahlt machen.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-zinc-900">
                  Kein Standard-Output
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Du bekommst keinen austauschbaren AI-Massenreport, sondern
                  konkrete Prioritäten für deine Website.
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-zinc-900">
                  Klar statt kompliziert
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Der Blueprint ist so gedacht, dass du direkt weißt, was du als
                  Nächstes umsetzen solltest.
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-zinc-900">
                  Für echte Umsetzung
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Nicht nur Analyse, sondern ein Plan, den du selbst oder mit
                  Unterstützung Schritt für Schritt umsetzen kannst.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-8">
            <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white">
                <div className="text-sm font-medium text-zinc-300">
                  Einmalige Freischaltung
                </div>
                <div className="mt-2 text-4xl font-bold tracking-tight">199€</div>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Individuell für dich erstellt. Kein generischer AI-Report.
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <div className="text-sm font-semibold text-zinc-900">
                      Enthalten in deinem Blueprint
                    </div>

                    <div className="mt-4 space-y-3 text-sm text-zinc-700">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-900" />
                        <p>Klare Prioritäten: Was zuerst ändern, was später.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-900" />
                        <p>Konkrete Verbesserungen für Struktur, Texte und CTAs.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-900" />
                        <p>SEO- und Content-Ideen mit echter Umsetzungslogik.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-900" />
                        <p>Ein Plan, den du direkt anwenden kannst.</p>
                      </div>
                    </div>
                  </div>

                  {canceled && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Deine Zahlung wurde abgebrochen. Du kannst den Checkout jederzeit erneut starten.
                    </div>
                  )}

                  {!!error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Weiterleitung zu Stripe..." : "Blueprint freischalten – 199€"}
                  </button>

                  <div className="text-center text-sm text-zinc-500">
                    Sichere Zahlung mit Stripe
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 text-xs text-zinc-500">
                    <span className="rounded-full bg-zinc-100 px-3 py-1">
                      individuell erstellt
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1">
                      Lieferung in 24h
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1">
                      klare Umsetzungsschritte
                    </span>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <div className="text-sm font-semibold text-zinc-900">
                      Was nach dem Kauf passiert
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                      <li>1. Zahlung wird bestätigt</li>
                      <li>2. Dein Blueprint wird individuell erstellt</li>
                      <li>3. Download-Link kommt innerhalb von 24 Stunden per E-Mail</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 p-4">
                    <div className="text-sm font-semibold text-zinc-900">
                      Support
                    </div>
                    <p className="mt-2 text-sm text-zinc-600">
                      Fragen? Schreib an{" "}
                      <a
                        href="mailto:reports@digitalstruktur.com"
                        className="font-medium text-zinc-900 underline"
                      >
                        reports@digitalstruktur.com
                      </a>
                    </p>
                  </div>

                  <div className="text-xs text-zinc-400 break-all">
                    Report ID: {rid || "nicht gefunden"}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}