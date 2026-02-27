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
        width: "min(1024px, calc(100% - 32px))",
        zIndex: 50,
      }}
    >
      <div className="bg-white border shadow-xl rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm text-gray-700">
            Wir verwenden Cookies, um unsere Website bereitzustellen und zu verbessern.
            Details findest du in unserer{" "}
            <a href="/datenschutz" className="underline">
              Datenschutzerklärung
            </a>.
          </div>

          <div className="flex gap-3">
            <button
              onClick={acceptNecessary}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
            >
              Nur notwendige
            </button>

            <button
              onClick={acceptAll}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}