"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Zahlung erfolgreich
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
          Dein Blueprint wird jetzt erstellt
        </h1>

        <p className="mt-4 text-base leading-7 text-zinc-600">
          Danke! Wir erstellen deinen <b>AI Website Blueprint</b> jetzt manuell und senden dir den Download-Link innerhalb von <b>24 Stunden</b> per E-Mail.
        </p>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="font-semibold text-zinc-900">Was passiert als Nächstes?</div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li>• Wir erstellen deinen Blueprint basierend auf deiner Analyse.</li>
            <li>• Du erhältst innerhalb von 24 Stunden einen Download-Link per E-Mail.</li>
            <li>• Bitte prüfe bei Bedarf auch deinen Spam-Ordner.</li>
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="font-semibold text-zinc-900">Fragen?</div>
          <p className="mt-2 text-sm text-zinc-600">
            Schreib einfach an{" "}
            <a
              className="font-medium text-zinc-900 underline"
              href="mailto:reports@digitalstruktur.com"
            >
              reports@digitalstruktur.com
            </a>
          </p>
        </div>

        <div className="mt-6 text-xs text-zinc-400 break-all">
          Session ID: {sessionId ?? "—"}
        </div>
      </div>
    </div>
  );
}