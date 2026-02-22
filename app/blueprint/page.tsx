"use client";

import { useSearchParams } from "next/navigation";

type CheckoutResponse = { url: string } | { error: string };

export default function BlueprintPage() {
  const params = useSearchParams();
  const reportId = params.get("rid");

  async function startCheckout() {
    if (!reportId) {
      alert("Report-ID fehlt. Bitte öffne den Blueprint-Link aus deiner Bestätigungsseite/E-Mail erneut.");
      return;
    }

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }), // ✅ WICHTIG
    });

    const data = (await res.json()) as CheckoutResponse;

    if (!res.ok) {
      const msg = "error" in data ? data.error : "Stripe checkout failed";
      alert(msg);
      return;
    }

    if ("url" in data && data.url) {
      window.location.href = data.url;
      return;
    }

    alert("Keine Checkout-URL erhalten.");
  }

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
          className="inline-block mt-6 rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700"
        >
          Blueprint jetzt freischalten →
        </button>

        {!reportId && (
          <div className="mt-3 text-sm text-blue-900/80">
            Hinweis: Report-ID fehlt. Bitte öffne den Blueprint-Link aus der Bestätigungsseite/E-Mail.
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-zinc-500">
        Hinweis: Der Blueprint wird nach Zahlung automatisch generiert.
      </div>
    </div>
  );
}