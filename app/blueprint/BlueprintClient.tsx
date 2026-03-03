"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BlueprintClient() {
  const sp = useSearchParams();
  const rid = sp.get("rid");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onDownload() {
    if (!rid) return;
    setErr(null);
    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* ...dein bestehendes Blueprint UI... */}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onDownload}
          disabled={!rid || loading}
          className="px-4 py-2 rounded-xl border bg-white hover:bg-zinc-50 disabled:opacity-50"
        >
          {loading ? "PDF wird erstellt…" : "PDF herunterladen"}
        </button>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}
      </div>
    </div>
  );
}