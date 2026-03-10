"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 font-sans sm:px-6 sm:py-16">
      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-zinc-50 px-6 py-8 sm:px-8 sm:py-10">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Zahlung erfolgreich
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Dein Blueprint wird jetzt erstellt
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
            Danke für deinen Kauf. Wir erstellen deinen{" "}
            <strong className="text-zinc-900">AI Website Blueprint</strong> jetzt
            individuell auf Basis deiner Analyse und senden dir den Download-Link
            innerhalb von <strong className="text-zinc-900">24 Stunden</strong>{" "}
            per E-Mail.
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="text-sm font-semibold text-zinc-900">
                Was passiert als Nächstes?
              </div>

              <div className="mt-4 grid gap-3">
                <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3">
                  <div className="mt-1 h-2.5 w-2.5 min-w-2.5 rounded-full bg-zinc-900" />
                  <p className="text-sm leading-6 text-zinc-700">
                    Wir erstellen deinen Blueprint individuell auf Basis deiner
                    Analyse und priorisieren die wichtigsten Hebel.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3">
                  <div className="mt-1 h-2.5 w-2.5 min-w-2.5 rounded-full bg-zinc-900" />
                  <p className="text-sm leading-6 text-zinc-700">
                    Du erhältst innerhalb von 24 Stunden einen Download-Link per
                    E-Mail.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3">
                  <div className="mt-1 h-2.5 w-2.5 min-w-2.5 rounded-full bg-zinc-900" />
                  <p className="text-sm leading-6 text-zinc-700">
                    Bitte prüfe bei Bedarf auch deinen Spam-Ordner, falls du
                    nichts siehst.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <div className="text-sm font-semibold text-zinc-900">
                Fragen oder ein Problem mit deiner Bestellung?
              </div>

              <p className="mt-2 text-sm leading-6 text-zinc-700">
                Wenn etwas unklar ist oder du innerhalb von 24 Stunden keine
                E-Mail erhalten hast, schreib uns einfach direkt an
              </p>

              <a
                className="mt-3 inline-block text-base font-semibold text-indigo-700 underline underline-offset-4 hover:text-indigo-800"
                href="mailto:support@digitalstruktur.com"
              >
                support@digitalstruktur.com
              </a>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="text-sm font-semibold text-zinc-900">
                Gut zu wissen
              </div>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Deine Bestellung ist erfolgreich eingegangen. Du musst nichts
                weiter tun — wir melden uns automatisch per E-Mail mit deinem
                fertigen Blueprint.
              </p>
            </div>
          </div>

          <div className="mt-6 text-xs break-all text-zinc-400">
            Session ID: {sessionId ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}