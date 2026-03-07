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
    <section className="mt-3 w-full">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-[28px] bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-6 text-center text-white shadow-[0_18px_40px_rgba(59,130,246,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_22px_50px_rgba(59,130,246,0.34)]"
        >
          <div className="text-xl font-bold tracking-tight">
            Detailreport + Textvorschläge per E-Mail erhalten →
          </div>
          <div className="mt-2 text-sm text-blue-100">
            Kostenloser Deep-Dive · ca. 2 Minuten · kein Spam
          </div>
        </button>
      ) : (
        <div className="w-full overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-b from-blue-50 via-white to-white shadow-[0_18px_45px_rgba(2,6,23,0.08)]">
          <div className="border-b border-blue-100/70 bg-white/70 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Kostenloser Detailreport
                </div>

                <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                  Erhalte konkrete Verbesserungsvorschläge für deine Website
                </h3>

                <p className="mt-2 max-w-2xl text-base leading-7 text-zinc-600">
                  Wir senden dir deinen persönlichen Detailreport mit klaren
                  Optimierungsideen, Textvorschlägen und den nächsten sinnvollen
                  Schritten direkt per E-Mail.
                </p>

                {!!websiteUrl && (
                  <p className="mt-4 text-sm text-zinc-500">
                    Analyse für:{" "}
                    <span className="font-medium text-zinc-700">{websiteUrl}</span>
                  </p>
                )}

                {!reportId && (
                  <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
                className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50"
                aria-label="Schließen"
                title="Schließen"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {status !== "success" ? (
              <>
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <label className="text-sm font-semibold text-zinc-800">
                      E-Mail-Adresse
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.de"
                      inputMode="email"
                      autoComplete="email"
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-6 py-4 text-lg text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className={
                      canSubmit
                        ? "w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-lg font-semibold text-white shadow-[0_14px_30px_rgba(59,130,246,0.34)] transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_18px_36px_rgba(59,130,246,0.40)] active:translate-y-0"
                        : "w-full rounded-2xl bg-zinc-300 px-6 py-4 text-lg font-semibold text-white opacity-80 cursor-not-allowed"
                    }
                  >
                    {status === "loading" ? "Sende…" : "Detailreport per E-Mail erhalten →"}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
                    Kein Spam
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
                    DSGVO-konform
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
                    Abmeldung jederzeit
                  </span>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="text-base font-semibold text-emerald-900">
                  ✅ Fast fertig!
                </div>
                <div className="mt-2 text-sm leading-6 text-emerald-800">
                  Bitte bestätige jetzt deine E-Mail-Adresse über den Link in deinem Postfach.
                  Danach senden wir dir den Detailreport direkt zu.
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {errorMsg || "Etwas ist schiefgelaufen."}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}