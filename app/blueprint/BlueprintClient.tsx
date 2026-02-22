"use client";

import React, { useCallback, useState } from "react";

type CheckoutSuccess = { url: string };
type CheckoutError = { error: string };

function isCheckoutSuccess(data: unknown): data is CheckoutSuccess {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as { url?: unknown };
  return typeof candidate.url === "string" && candidate.url.trim().length > 0;
}

function isCheckoutError(data: unknown): data is CheckoutError {
  if (typeof data !== "object" || data === null) return false;
  const candidate = data as { error?: unknown };
  return typeof candidate.error === "string" && candidate.error.trim().length > 0;
}

export default function BlueprintClient({ reportId }: { reportId: string | null }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    setMessage(null);

    if (!reportId) {
      setMessage(
        "Report-ID fehlt. Bitte öffne den Blueprint-Link aus deiner Bestätigungsseite oder E-Mail erneut."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setMessage(isCheckoutError(data) ? data.error : "Stripe Checkout fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }

      if (isCheckoutSuccess(data)) {
        window.location.assign(data.url);
        return;
      }

      setMessage("Keine Checkout-URL erhalten. Bitte versuche es erneut.");
    } catch {
      setMessage("Netzwerkfehler. Bitte prüfe deine Verbindung und versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold">AI Website Blueprint – 30 Tage Umsetzungsplan</h1>

      <p className="mt-4 text-zinc-700 text-lg">
        Dein Detailreport zeigt dir, was nicht optimal läuft.
        <br />
        Der Blueprint zeigt dir exakt, wie du es behebst.
      </p>

      <div className="mt-8 rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold">Was du bekommst:</h2>
        <ul className="mt-4 space-y-3 text-zinc-800">
          <li>✓ Neue Hero-Struktur mit klarer Positionierung</li>
          <li>✓ Konkrete Textvorschläge für deine Startseite</li>
          <li>✓ CTA-Architektur für mehr Leads oder Verkäufe</li>
          <li>✓ SEO-Seitenplan (welche Seiten du brauchst)</li>
          <li>✓ Priorisierte 30-Tage Roadmap</li>
          <li>✓ Klarer Fokus: Was zuerst, was später</li>
        </ul>
      </div>

      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="text-2xl font-bold text-blue-900">199€ einmalig</div>
        <p className="mt-2 text-blue-900/90">Kein Abo. Sofortiger Zugriff nach Zahlung.</p>

        <button
          onClick={startCheckout}
          disabled={loading}
          className="inline-block mt-6 rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Weiterleitung zu Stripe…" : "Blueprint jetzt freischalten →"}
        </button>

        {!reportId && (
          <div className="mt-3 text-sm text-blue-900/80">
            Hinweis: Report-ID fehlt. Bitte öffne den Blueprint-Link aus der Bestätigungsseite/E-Mail.
          </div>
        )}

        {message && <div className="mt-3 text-sm text-blue-900/90">{message}</div>}
      </div>

      <div className="mt-8 text-sm text-zinc-500">Hinweis: Der Blueprint wird nach Zahlung automatisch generiert.</div>
    </div>
  );
}