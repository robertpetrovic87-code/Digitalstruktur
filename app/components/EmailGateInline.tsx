"use client";

import { useMemo, useState } from "react";

type Props = {
  websiteUrl: string;
  reportId: string | null;
};

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
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-3xl bg-blue-600 px-6 py-6 text-left text-white shadow-[0_16px_40px_rgba(37,99,235,0.25)] transition hover:bg-blue-700"
        >
          <div className="text-xl font-bold tracking-tight">
            Detailreport + Textvorschläge per E-Mail erhalten →
          </div>
          <div className="mt-2 text-sm text-blue-100">
            Kostenloser Deep-Dive · ca. 2 Minuten · Double Opt-in
          </div>
        </button>
      ) : (
        <div className="w-full rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 via-white to-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                Kostenloser Detailreport
              </div>

              <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
                Erhalte konkrete Verbesserungen für deine Website
              </div>

              <div className="mt-2 text-base leading-7 text-zinc-600">
                Wir senden dir deinen persönlichen Detailreport mit konkreten Optimierungen
                und Textvorschlägen direkt per E-Mail.
              </div>

              {!reportId && (
                <div className="mt-3 text-sm text-blue-900/80">
                  Bitte starte zuerst eine Analyse, damit wir deinen Report korrekt zuordnen können.
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
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50"
              aria-label="Schließen"
              title="Schließen"
            >
              ✕
            </button>
          </div>

          {status !== "success" ? (
            <>
              <div className="mt-6 flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  inputMode="email"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-lg text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  className={
                    canSubmit
                      ? "w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800"
                      : "w-full rounded-2xl bg-zinc-300 px-6 py-4 text-lg font-semibold text-white cursor-not-allowed"
                  }
                >
                  {status === "loading" ? "Sende…" : "Detailreport per E-Mail erhalten"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">Kein Spam</span>
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">DSGVO-konform</span>
                <span className="rounded-full bg-white px-3 py-1 shadow-sm">Abmeldung jederzeit</span>
              </div>

              {reportId && (
                <div className="mt-3 text-[11px] text-zinc-400">
                  Report-ID verknüpft: <span className="font-mono">{reportId}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-semibold text-emerald-900">✅ Fast fertig!</div>
              <div className="mt-1 text-sm text-emerald-800">
                Bitte bestätige jetzt deine E-Mail. Danach bekommst du deinen Detailreport direkt zugeschickt.
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {errorMsg || "Etwas ist schiefgelaufen."}
            </div>
          )}
        </div>
      )}
    </section>
  );
}