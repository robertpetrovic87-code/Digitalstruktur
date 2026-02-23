"use client";

import { useMemo, useState } from "react";

type Props = {
  websiteUrl: string; // nur für UI/Info, optional
  reportId: string | null; // ✅ wichtig
};

type ApiOk = { ok: true; reportId?: string };
type ApiErr = { error: string; need?: string[] };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isApiErr(data: unknown): data is ApiErr {
  if (typeof data !== "object" || data === null) return false;
  const c = data as { error?: unknown; need?: unknown };
  const needOk =
    c.need === undefined ||
    (Array.isArray(c.need) && c.need.every((x) => typeof x === "string"));
  return typeof c.error === "string" && c.error.trim().length > 0 && needOk;
}

export default function EmailGateInline({ websiteUrl, reportId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && status !== "loading" && !!reportId;
  }, [email, status, reportId]);

  async function onSubmit() {
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/request-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ request-report erwartet: email + reportId
        body: JSON.stringify({ email, reportId }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = isApiErr(data) ? data.error : "Request failed";
        setErrorMsg(msg);
        setStatus("error");
        return;
      }

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
            background: "#2563eb",
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
        /* OPEN STATE */
        <div className="w-full text-base rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-6 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-zinc-900">Dein persönlicher Detailreport</div>
              <div className="mt-1 text-base text-zinc-600">
                Konkrete Verbesserungen & Textvorschläge per E-Mail. Double Opt-in erforderlich.
              </div>

              {/* ✅ Safety-Hinweis, falls reportId fehlt */}
              {!reportId && (
                <div className="mt-3 text-sm text-blue-900/80">
                  Hinweis: Bitte starte zuerst eine Analyse, damit wir deinen Report zuordnen können.
                </div>
              )}
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

              {/* optional: kleine Debug-Info, kannst du später entfernen */}
              {reportId && (
                <div className="mt-2 text-[11px] text-zinc-400">
                  Report-ID verknüpft: <span className="font-mono">{reportId}</span>
                </div>
              )}
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