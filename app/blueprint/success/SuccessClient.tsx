"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "creating" | "created" | "error";

export default function SuccessClient() {
  const sp = useSearchParams();
  const rid = sp.get("rid");
  const sessionId = sp.get("session_id");

  const [state, setState] = useState<State>("creating");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!rid) return;

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/blueprint/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rid }),
        });

        if (!res.ok) throw new Error(await res.text());

        if (cancelled) return;
        setState("created");

        // kurzer Moment UX, dann redirect
        setTimeout(() => {
        if (!rid) return;
        const ridStr = rid; // jetzt string
        window.location.href = `/blueprint?rid=${encodeURIComponent(ridStr)}`;
        }, 800);
      } catch (e: unknown) {
        const m = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
        if (cancelled) return;
        setState("error");
        setMsg(m);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [rid]);

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold">✅ Zahlung erfolgreich</h1>
      <p className="mt-3 text-zinc-700">Danke! Dein Blueprint wird jetzt erstellt.</p>

      <div className="mt-6 rounded-2xl border p-5 bg-white">
        <div className="text-sm text-zinc-500">Session ID</div>
        <div className="font-mono text-sm break-all">{sessionId ?? "—"}</div>
      </div>

      {!rid ? (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="font-semibold">⚠️ Report ID fehlt</div>
          <p className="text-sm text-zinc-600 mt-2">
            Bitte öffne den Link erneut aus der Checkout-URL (sie enthält rid=...).
          </p>
        </div>
      ) : state === "creating" ? (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="font-semibold">Blueprint wird erstellt…</div>
          <p className="text-sm text-zinc-600 mt-2">Du wirst gleich weitergeleitet.</p>
          <div className="mt-4">
            <a className="underline" href={`/blueprint?rid=${encodeURIComponent(rid)}`}>
              Falls es hängt: zum Blueprint →
            </a>
          </div>
        </div>
      ) : state === "error" ? (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="font-semibold text-red-600">⚠️ Erstellung fehlgeschlagen</div>
          <p className="text-sm text-zinc-600 mt-2 break-words">{msg}</p>
          <div className="mt-4">
            <a className="underline" href={`/blueprint?rid=${encodeURIComponent(rid)}`}>
              Zurück zum Blueprint →
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="font-semibold">✅ Blueprint ist bereit</div>
          <p className="text-sm text-zinc-600 mt-2">Weiterleitung…</p>
        </div>
      )}
    </div>
  );
}