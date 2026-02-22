"use client";

import { useMemo, useState } from "react";

type Props = {
  websiteUrl: string;
  // Optional – falls du es später übergibst:
  // goal?: string;
  // score?: number;
};

type ApiOk = { ok: true };
type ApiErr = { error: string; details?: unknown };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EmailGateInline({ websiteUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(
    () => isValidEmail(email) && status !== "loading",
    [email, status]
  );

  async function onSubmit() {
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      // ✅ WICHTIG: Statt /api/subscribe (MailerLite) jetzt /api/request-report (Resend)
      const res = await fetch("/api/request-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ request-report erwartet: email + website
        body: JSON.stringify({ email, website: websiteUrl }),
        // Wenn du später goal/score übergibst:
        // body: JSON.stringify({ email, website: websiteUrl, goal, score }),
      });

      const data = (await res.json()) as ApiOk | ApiErr;

      if (!res.ok) {
        const msg = "error" in data ? data.error : "Request failed";
        setErrorMsg(msg);
        setStatus("error");
        return;
      }

      // ✅ Erfolg heißt: Confirm-Mail wurde gesendet → User muss bestätigen
      setStatus("success");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <section className="mt-8 w-full">
      {/* CLOSED STATE: big blue CTA */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: "100%",
            background: "#2563eb", // blau
            color: "white",
            padding: "24px",
            borderRadius: "16px",
            fontSize: "18px",
            fontWeight: 700,
            textAlign: "left",
          }}
        >
          <div>Detailreport + Textvorschläge per E-Mail erhalten →</div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 400, opacity: 0.9 }}>
            Kostenloser Deep-Dive · ca. 2 Minuten · Double Opt-in
          </div>
        </button>
      ) : (
        /* OPEN STATE: white card with form */
        <div className="w-full text-base rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-6 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                Dein persönlicher Detailreport
              </div>
              <div className="mt-1 text-base text-zinc-600">
                Konkrete Verbesserungen & Textvorschläge per E-Mail. Double Opt-in erforderlich.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setStatus("idle");
                setErrorMsg("");
              }}
              className="shrink-0 rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-white"
              aria-label="Schließen"
              title="Schließen"
            >
              ✕
            </button>
          </div>

          {status !== "success" ? (
            <>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  inputMode="email"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-zinc-300 !px-5 !py-5 !text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-zinc-400"
                />

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  className={
                    canSubmit
                      ? "w-full sm:w-auto rounded-2xl bg-blue-600 !px-7 !py-5 !text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
                      : "w-full sm:w-auto rounded-2xl bg-zinc-300 !px-7 !py-5 !text-lg font-semibold text-white cursor-not-allowed"
                  }
                >
                  {status === "loading" ? "Sende…" : "Report senden"}
                </button>
              </div>

              <div className="mt-4 text-xs text-zinc-500">
                ✅ Kein Spam · 🔒 DSGVO-konform · ↩️ Abmeldung jederzeit
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-semibold text-emerald-900">✅ Fast fertig!</div>
              <div className="mt-1 text-sm text-emerald-800">
                Bitte bestätige jetzt deine E-Mail (Double Opt-in). Danach bekommst du den Detailreport.
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {errorMsg || "Etwas ist schiefgelaufen."}
            </div>
          )}
        </div>
      )}
    </section>
  );
}