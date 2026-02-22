"use client";

import React, { useCallback, useEffect, useState } from "react";

type ConfirmSuccess = { ok: true; reportId?: string };
type ConfirmError = { ok: false; error: string };

function isConfirmSuccess(data: unknown): data is ConfirmSuccess {
  if (typeof data !== "object" || data === null) return false;
  const c = data as { ok?: unknown; reportId?: unknown };
  return c.ok === true && (c.reportId === undefined || typeof c.reportId === "string");
}

function isConfirmError(data: unknown): data is ConfirmError {
  if (typeof data !== "object" || data === null) return false;
  const c = data as { ok?: unknown; error?: unknown };
  return c.ok === false && typeof c.error === "string" && c.error.trim().length > 0;
}

export default function ConfirmClient({ token }: { token: string | null }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const runConfirm = useCallback(async () => {
    setMessage(null);

    if (!token) {
      setStatus("error");
      setMessage("Token fehlt. Bitte öffne den Bestätigungslink aus deiner E-Mail erneut.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setStatus("error");
        setMessage(isConfirmError(data) ? data.error : "Bestätigung fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }

      if (isConfirmSuccess(data)) {
        setStatus("success");
        setReportId(data.reportId ?? null);
        return;
      }

      setStatus("error");
      setMessage("Unerwartete Antwort. Bitte versuche es erneut.");
    } catch {
      setStatus("error");
      setMessage("Netzwerkfehler. Bitte versuche es erneut.");
    }
  }, [token]);

  useEffect(() => {
    void runConfirm();
  }, [runConfirm]);

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold">E-Mail bestätigen</h1>

      {status === "loading" && <p className="mt-4 text-zinc-700">Bestätige…</p>}

      {status === "success" && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="font-semibold text-green-900">Bestätigung erfolgreich ✅</div>
          <p className="mt-1 text-green-900/90">
            Du bekommst gleich deinen Detailreport per E-Mail.
          </p>

          {reportId && (
            <a
              className="inline-block mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              href={`/blueprint?rid=${encodeURIComponent(reportId)}`}
            >
              Zum Blueprint →
            </a>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="font-semibold text-red-900">Bestätigung fehlgeschlagen</div>
          <p className="mt-1 text-red-900/90">{message ?? "Bitte versuche es erneut."}</p>

          <button
            onClick={runConfirm}
            className="inline-block mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Erneut versuchen
          </button>
        </div>
      )}
    </div>
  );
}