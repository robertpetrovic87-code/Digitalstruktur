"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ReportStatus = {
  id: string;
  purchased_blueprint: boolean;
  blueprint_created_at: string | null;
  blueprint_json: unknown | null;
};

export default function BlueprintClient() {
  const sp = useSearchParams();
  const rid = sp.get("rid");

  const [report, setReport] = useState<ReportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadStatus() {
    if (!rid) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/get?rid=${encodeURIComponent(rid)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ReportStatus;
      setReport(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  async function startCheckout() {
    if (!rid) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ⚠️ wichtig: dein Checkout erwartet reportId
        body: JSON.stringify({ reportId: rid }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as { url?: string };
      if (!json.url) throw new Error("Missing checkout url");
      window.location.href = json.url;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onDownloadPdf() {
    if (!rid) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/blueprint/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rid }),
      });

      if (res.status === 202) {
        throw new Error("Blueprint ist noch nicht bereit. Bitte in ein paar Sekunden erneut versuchen.");
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as { url: string };
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!rid) {
    return <div className="max-w-3xl mx-auto p-6">Fehlende Report ID (rid).</div>;
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6">Lade…</div>;
  }

  if (err) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-red-600">{err}</div>
        <button onClick={loadStatus} className="mt-4 px-4 py-2 rounded-xl border">
          Erneut laden
        </button>
      </div>
    );
  }

  if (!report) {
    return <div className="max-w-3xl mx-auto p-6">Nicht gefunden.</div>;
  }

  // ✅ 1) NICHT gekauft → nur Checkout zeigen (kein PDF Button!)
  if (!report.purchased_blueprint) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">AI Website Blueprint</h1>
        <p className="mt-2 text-zinc-700">
          30-Tage Umsetzungsplan (inkl. PDF Download). Einmalig 199€.
        </p>

        <button
          onClick={startCheckout}
          disabled={busy}
          className="mt-6 px-5 py-3 rounded-xl bg-black text-white disabled:opacity-50"
        >
          {busy ? "Weiterleitung…" : "Blueprint freischalten (199€)"}
        </button>
      </div>
    );
  }

  // ✅ 2) gekauft aber blueprint noch nicht fertig → warten + refresh
  if (!report.blueprint_created_at || !report.blueprint_json) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Blueprint wird erstellt…</h1>
        <p className="mt-2 text-zinc-700">Bitte kurz warten und dann aktualisieren.</p>

        <button onClick={loadStatus} disabled={busy} className="mt-6 px-4 py-2 rounded-xl border">
          {busy ? "…" : "Aktualisieren"}
        </button>
      </div>
    );
  }

  // ✅ 3) gekauft + blueprint vorhanden → PDF Button anzeigen
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dein AI Website Blueprint</h1>

        <button
          onClick={onDownloadPdf}
          disabled={busy}
          className="px-4 py-2 rounded-xl border bg-white hover:bg-zinc-50 disabled:opacity-50"
        >
          {busy ? "PDF wird erstellt…" : "PDF herunterladen"}
        </button>
      </div>

      {/* ✅ Hier kommt dein bestehendes Blueprint Rendering rein */}
      {/* (vorerst zum Debuggen:) */}
      <pre className="mt-6 text-xs bg-zinc-50 p-4 rounded-xl overflow-auto">
        {JSON.stringify(report.blueprint_json, null, 2)}
      </pre>
    </div>
  );
}