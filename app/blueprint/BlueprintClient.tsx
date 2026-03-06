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
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
          Individueller Website Blueprint
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
          Dein 30-Tage Umsetzungsplan für mehr Anfragen über deine Website
        </h1>

        <p className="mt-4 text-base leading-7 text-zinc-600">
          Erhalte einen klaren, individuellen Plan, der zeigt, welche Änderungen auf deiner Website die größte Wirkung haben — inklusive Struktur, Conversion, SEO und konkreten nächsten Schritten.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 p-4">
            <div className="font-semibold text-zinc-900">Enthalten</div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700">
              <li>30 Tage Optimierungsplan</li>
              <li>Conversion Verbesserungen</li>
              <li>SEO Struktur</li>
              <li>Content & AI Prompts</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-4">
            <div className="font-semibold text-zinc-900">Für dich relevant, wenn du</div>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700">
              <li>mehr Anfragen über die Website willst</li>
              <li>nicht weißt, was du zuerst verbessern sollst</li>
              <li>einen klaren Plan statt Bauchgefühl willst</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
          <div className="text-sm text-zinc-500">Preis</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">199€</div>
          <div className="mt-2 text-sm text-zinc-600">
            Einmalige Zahlung. Manuell erstellt. Kein generischer Auto-Report.
          </div>
        </div>

        {canceled && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Deine Zahlung wurde abgebrochen. Du kannst den Checkout jederzeit erneut starten.
          </div>
        )}

        {!!error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Weiterleitung zu Stripe..." : "Blueprint freischalten – 199€"}
          </button>

          <div className="text-sm text-zinc-500">
            Sichere Zahlung mit Stripe
          </div>
        </div>

        <div className="mt-6 text-xs text-zinc-400 break-all">
          Report ID: {rid || "nicht gefunden"}
        </div>
      </div>
    </div>
  );
}