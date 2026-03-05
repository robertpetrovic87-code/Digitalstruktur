"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const sp = useSearchParams();
  const rid = sp.get("rid");
  const sessionId = sp.get("session_id");

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold">✅ Zahlung erfolgreich</h1>
      <p className="mt-3 text-zinc-700">
        Danke! Wir erstellen deinen <b>AI Website Blueprint</b> und senden dir den Download-Link innerhalb von{" "}
        <b>24 Stunden</b> per E-Mail.
      </p>

      <div className="mt-6 rounded-2xl border p-5 bg-white">
        <div className="text-sm text-zinc-500">Session ID</div>
        <div className="font-mono text-sm break-all">{sessionId ?? "—"}</div>
      </div>

      {!rid ? (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="font-semibold">⚠️ Report ID fehlt</div>
          <p className="text-sm text-zinc-600 mt-2">
            Bitte öffne den Link erneut aus der Checkout-URL (sie enthält <span className="font-mono">rid=...</span>).
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="font-semibold">Was passiert als Nächstes?</div>
          <ul className="mt-2 text-sm text-zinc-700 list-disc pl-5 space-y-1">
            <li>Wir erstellen deinen Blueprint basierend auf deiner Analyse.</li>
            <li>Du erhältst einen Download-Link per E-Mail (innerhalb von 24 Stunden).</li>
            <li>Wenn du nichts bekommst: bitte Spam-Ordner prüfen oder antworte auf deine Analyse-Mail.</li>
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-zinc-800"
              href={`/blueprint?rid=${encodeURIComponent(rid)}`}
            >
              Zum Blueprint-Status →
            </a>

            <a className="underline text-sm" href={`/blueprint?rid=${encodeURIComponent(rid)}&help=1`}>
              Ich habe keine E-Mail erhalten
            </a>
          </div>

          <div className="mt-4 text-xs text-zinc-500">Report-ID: {rid}</div>
        </div>
      )}
    </div>
  );
}