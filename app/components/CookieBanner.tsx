"use client";

import { useState } from "react";

type Consent = "all" | "necessary" | null;

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("cookie-consent");
    return stored === "all" || stored === "necessary" ? stored : null;
  });

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
    <div
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 24,
        width: "min(880px, calc(100% - 64px))",
        zIndex: 50,
      }}
    >
      <div className="bg-white border border-zinc-200 shadow-2xl rounded-3xl px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div className="text-sm text-zinc-600 leading-relaxed">
            Wir verwenden Cookies, um unsere Website bereitzustellen und zu verbessern.
            Details findest du in unserer{" "}
            <a
              href="/datenschutz"
              className="underline font-medium text-zinc-800 hover:text-black"
            >
              Datenschutzerklärung
            </a>.
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={acceptNecessary}
              className="px-5 py-2.5 border border-zinc-300 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition"
            >
              Nur notwendige
            </button>

            <button
              onClick={acceptAll}
              className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition"
            >
              Alle akzeptieren
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}