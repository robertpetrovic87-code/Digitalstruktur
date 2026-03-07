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
  <div className="min-h-screen bg-gradient-to-b from-white via-zinc-50 to-white">
    <div className="mx-auto max-w-3xl px-5 py-12">

      {/* HEADER */}
      <div className="text-center">

        <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm">
          Individueller Website Blueprint
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Dein klarer 30-Tage Plan
          <br />
          für mehr Anfragen über deine Website
        </h1>

        <p className="mt-4 text-base leading-7 text-zinc-600">
          Kein generischer AI-Report, sondern ein konkreter Umsetzungsplan,
          der dir zeigt welche Änderungen auf deiner Website die größte Wirkung haben.
        </p>

        {/* CTA 1 */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="mt-8 w-full rounded-2xl bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-black disabled:opacity-60"
        >
          {loading ? "Weiterleitung zu Stripe..." : "Blueprint freischalten – 199€"}
        </button>

        <div className="mt-2 text-sm text-zinc-500">
          Sichere Zahlung mit Stripe
        </div>

      </div>

      {/* VALUE CARDS */}
      <div className="mt-12 grid gap-4">

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="font-semibold text-zinc-900">
            Individuell für dich erstellt
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            Dein Blueprint basiert auf deiner Website Analyse und zeigt dir
            genau welche Änderungen am meisten Wirkung haben.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="font-semibold text-zinc-900">
            Lieferung in 24 Stunden
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            Du erhältst deinen Blueprint per E-Mail mit klaren Prioritäten
            und konkreten Umsetzungsschritten.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="font-semibold text-zinc-900">
            Fokus auf Wirkung
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            Statt Theorie bekommst du einen Plan, der dir zeigt
            was du zuerst ändern solltest.
          </p>
        </div>

      </div>

      {/* WHAT YOU GET */}
      <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

        <h3 className="text-lg font-semibold text-zinc-900">
          Was du bekommst
        </h3>

        <ul className="mt-4 space-y-3 text-sm text-zinc-700">
          <li>✓ 30-Tage Umsetzungsplan mit klaren Prioritäten</li>
          <li>✓ Conversion-Verbesserungen für mehr Anfragen</li>
          <li>✓ Struktur-Optimierungen für bessere Nutzerführung</li>
          <li>✓ SEO- und Content-Ideen</li>
          <li>✓ AI Prompts für bessere Website Texte</li>
        </ul>

      </div>

      {/* CTA 2 */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-black disabled:opacity-60"
      >
        {loading ? "Weiterleitung zu Stripe..." : "Blueprint freischalten – 199€"}
      </button>

      {/* PREVIEW */}
      <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

        <h3 className="text-lg font-semibold text-zinc-900">
          Beispiel: So kann dein Blueprint aussehen
        </h3>

        <div className="mt-6 space-y-5 text-sm text-zinc-700">

          <div>
            <div className="font-semibold text-zinc-900">Woche 1</div>
            <ul className="mt-2 space-y-1">
              <li>• Hero klarer auf Nutzen ausrichten</li>
              <li>• wichtigste CTA prominenter platzieren</li>
              <li>• Navigation vereinfachen</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-zinc-900">Woche 2</div>
            <ul className="mt-2 space-y-1">
              <li>• Vertrauen sichtbarer machen</li>
              <li>• Angebot klarer kommunizieren</li>
              <li>• Formulare vereinfachen</li>
            </ul>
          </div>

          <div>
            <div className="font-semibold text-zinc-900">Woche 3</div>
            <ul className="mt-2 space-y-1">
              <li>• Content Struktur verbessern</li>
              <li>• SEO Seiten definieren</li>
              <li>• interne Verlinkung aufbauen</li>
            </ul>
          </div>

        </div>

      </div>

      {/* CTA 3 */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="mt-10 w-full rounded-2xl bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-black disabled:opacity-60"
      >
        {loading ? "Weiterleitung zu Stripe..." : "Blueprint freischalten – 199€"}
      </button>

      {/* TRUST */}
      <div className="mt-10 text-center text-sm text-zinc-500">
        Sichere Zahlung • Lieferung innerhalb 24h • individueller Plan
      </div>

      <div className="mt-6 text-center text-xs text-zinc-400 break-all">
        Report ID: {rid || "nicht gefunden"}
      </div>

    </div>
  </div>
);
}