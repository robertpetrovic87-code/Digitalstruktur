"use client";

import { useEffect, useState } from "react";

type State =
  | { status: "idle" | "creating" | "created"; message?: string }
  | { status: "error"; message: string };

export default function SuccessClient({ rid }: { rid: string }) {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState({ status: "creating" });

      try {
        const res = await fetch("/api/blueprint/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rid }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }

        const json = (await res.json()) as { status?: string };

        if (cancelled) return;

        if (json.status === "created" || json.status === "already_created") {
          setState({ status: "created" });

          // Optional: Auto redirect after 800ms
          setTimeout(() => {
            window.location.href = `/blueprint?rid=${encodeURIComponent(rid)}`;
          }, 800);
        } else {
          setState({ status: "created" }); // fallback
        }
      } catch (e: unknown) {
  const msg =
    e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);

  if (cancelled) return;
  setState({ status: "error", message: msg });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [rid]);

  return (
    <div className="mt-6 rounded-2xl border p-5 bg-white">
      {state.status === "creating" ? (
        <>
          <div className="font-semibold">Blueprint wird erstellt…</div>
          <p className="text-sm text-zinc-600 mt-2">
            Das dauert meist nur wenige Sekunden. Du wirst gleich automatisch weitergeleitet.
          </p>
        </>
      ) : state.status === "created" ? (
        <>
          <div className="font-semibold">✅ Blueprint ist bereit</div>
          <a className="inline-block mt-3 underline" href={`/blueprint?rid=${encodeURIComponent(rid)}`}>
            Zum Blueprint →
          </a>
        </>
      ) : (
        <>
          <div className="font-semibold text-red-600">⚠️ Erstellung fehlgeschlagen</div>
          <p className="text-sm text-zinc-600 mt-2 break-words">{state.message}</p>
          <div className="flex gap-3 mt-4">
            <button
              className="px-4 py-2 rounded-xl border"
              onClick={() => window.location.reload()}
            >
              Nochmal versuchen
            </button>
            <a className="px-4 py-2 rounded-xl border" href={`/blueprint?rid=${encodeURIComponent(rid)}`}>
              Blueprint Seite öffnen
            </a>
          </div>
        </>
      )}
    </div>
  );
}