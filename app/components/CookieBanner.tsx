"use client";

import { useState } from "react";

type Consent = "all" | "necessary" | null;

function getInitialConsent(): Consent {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("cookie-consent");
  return stored === "all" || stored === "necessary" ? stored : null;
}

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(getInitialConsent);

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", "all");
    setConsent("all");
  };

  const acceptNecessary = () => {
    localStorage.setItem("cookie-consent", "necessary");
    setConsent("necessary");
  };

  if (consent !== null) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-4xl rounded-[24px] border border-slate-200 bg-white/95 px-5 py-5 shadow-[0_18px_50px_rgba(2,6,23,0.16)] backdrop-blur sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm leading-7 text-slate-600">
            Wir verwenden Cookies, um unsere Website bereitzustellen und zu verbessern.
            Details findest du in unserer{" "}
            <a
              href="/datenschutz"
              className="font-medium text-slate-900 underline hover:text-black"
            >
              Datenschutzerklärung
            </a>.
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={acceptNecessary}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Nur notwendige
            </button>

            <button
              type="button"
              onClick={acceptAll}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}