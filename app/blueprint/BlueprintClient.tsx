"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ReportStatus = {
  id: string;
  purchased_blueprint: boolean;
  status: string | null;
  paid_at: string | null;
  email: string | null;
  url: string | null;
  goal: string | null;
};

export default function BlueprintClient() {
  const sp = useSearchParams();
  const rid = sp.get("rid");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<ReportStatus | null>(null);

  const ridSafe = useMemo(() => (typeof rid === "string" ? rid : null), [rid]);

  async function loadStatus(isRefresh = false) {
  if (!ridSafe) return;
  setErr(null);

  if (isRefresh) setRefreshing(true);
  else setLoading(true);

  try {
    const res = await fetch(`/api/reports/get?rid=${encodeURIComponent(ridSafe)}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }

    const json = (await res.json()) as ReportStatus;
    setReport(json);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
    setErr(msg);
  } finally {
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }
}

  useEffect(() => {
    if (!ridSafe) {
      setLoading(false);
      return;
    }
    void loadStatus(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ridSafe]);

  async function onBuy() {
    if (!ridSafe) return;
    setErr(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: ridSafe }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as { url?: string };
      if (!json.url) throw new Error("Stripe URL missing");
      window.location.href = json.url;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      setErr(msg);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold">AI Website Blueprint</h1>
      <p className="mt-2 text-zinc-600">
        Dein 30-Tage Umsetzungsplan (Struktur, Copy, CTA, SEO) – individuell basierend auf deiner Analyse.
      </p>

      {!ridSafe ? (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="font-semibold">⚠️ Report ID fehlt</div>
          <p className="text-sm text-zinc-600 mt-2">
            Bitte öffne den Blueprint-Link erneut aus der E-Mail / Analyse.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-2xl border p-5 bg-white text-sm text-zinc-600">Status wird geladen…</div>
      ) : null}

      {err ? <div className="mt-4 text-sm text-red-600">{err}</div> : null}

      {ridSafe && !loading && report ? (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="text-sm text-zinc-500">Status</div>
          <div className="mt-1 font-medium">
            {report.purchased_blueprint ? "✅ Bezahlt" : "❌ Noch nicht gekauft"}
          </div>

          <div className="mt-4 text-sm text-zinc-600">
            {report.purchased_blueprint ? (
              <>
                Danke! Dein Blueprint wird jetzt erstellt und innerhalb von <b>24 Stunden</b> per E-Mail geliefert.
                {report.email ? (
                  <div className="mt-2">
                    Zustellung an: <span className="font-mono">{report.email}</span>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                Du kannst deinen Blueprint jetzt freischalten (einmalig <b>199€</b>).
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!report.purchased_blueprint ? (
              <button
                onClick={onBuy}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-zinc-800"
              >
                Blueprint kaufen (199€)
              </button>
            ) : null}

            <button
              onClick={() => loadStatus(true)}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl border bg-white hover:bg-zinc-50 disabled:opacity-50"
            >
              {refreshing ? "Aktualisiere…" : "Aktualisieren"}
            </button>
          </div>

          {report.purchased_blueprint ? (
            <div className="mt-5 rounded-xl bg-zinc-50 border p-4 text-sm text-zinc-700">
              <div className="font-semibold">Noch nichts erhalten?</div>
              <div className="mt-1">
                Antworte einfach auf die Analyse-Mail oder schreibe an{" "}
                <span className="font-mono">support@digitalstruktur.com</span> (mit deiner Report-ID).
              </div>
              <div className="mt-2 text-xs text-zinc-500">Report-ID: {ridSafe}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}