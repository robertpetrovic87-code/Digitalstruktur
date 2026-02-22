"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

/* ---------------- Types ---------------- */

type SeoQuickWin = {
  title: string;
  how: string;
  impact: "high" | "medium" | "low";
};

type CopyPack = {
  headlines: string[];
  subheadline: string;
  ctas: string[];
};

type AnalyzerResult = {
  overallScore?: number;
  strengths?: string[];
  seoQuickWins?: SeoQuickWin[];
  copyPack?: CopyPack;
};

type ReportRow = {
  id: string;
  url: string;
  goal: string;
  result_json: AnalyzerResult;
};

/* ---------------- Helpers ---------------- */

function base64urlToString(input: string): string {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  return atob(base64);
}

function getReportIdFromToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  try {
    const payloadStr = base64urlToString(parts[0]);
    const parsed: unknown = JSON.parse(payloadStr);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "reportId" in parsed &&
      typeof (parsed as { reportId?: unknown }).reportId === "string"
    ) {
      return (parsed as { reportId: string }).reportId;
    }

    return null;
  } catch {
    return null;
  }
}

/* ---------------- Page ---------------- */

export default function ConfirmPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const reportId = useMemo(() => {
    if (!token) return null;
    return getReportIdFromToken(token);
  }, [token]);

  const [state, setState] = useState<"loading" | "confirmed" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [report, setReport] = useState<ReportRow | null>(null);

  useEffect(() => {
    async function run() {
      if (!token) {
        setState("error");
        setErrorMsg("Missing token.");
        return;
      }

      // 1) Confirm (sends detailed email)
      const confirmRes = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const confirmJson: unknown = await confirmRes.json();

      const ok =
        confirmRes.ok &&
        typeof confirmJson === "object" &&
        confirmJson !== null &&
        "ok" in confirmJson;

      if (!ok) {
        setState("error");
        setErrorMsg("Confirmation failed.");
        return;
      }

      // 2) Load mini report (optional)
      if (reportId) {
        const reportRes = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId }),
        });

        const reportJson: unknown = await reportRes.json();

        if (
          reportRes.ok &&
          typeof reportJson === "object" &&
          reportJson !== null &&
          "report" in reportJson
        ) {
          setReport((reportJson as { report: ReportRow }).report);
        }
      }

      setState("confirmed");
    }

    run();
  }, [token, reportId]);

  if (state === "loading") {
    return (
      <div className="p-8 font-sans">
        <h1 className="text-2xl font-bold">Email Confirmation</h1>
        <p className="mt-2 text-zinc-600">Confirming…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="p-8 font-sans">
        <h1 className="text-2xl font-bold">Email Confirmation</h1>
        <p className="mt-2 text-red-600">{errorMsg}</p>
      </div>
    );
  }

  const result = report?.result_json;
  const score = result?.overallScore ?? "—";
  const strengths = result?.strengths ?? [];
  const seo = result?.seoQuickWins ?? [];
  const copy = result?.copyPack;

  const blueprintHref = reportId
    ? `/blueprint?rid=${encodeURIComponent(reportId)}`
    : "/blueprint";

  return (
    <div className="p-8 font-sans max-w-3xl">
      <h1 className="text-2xl font-bold">✅ Bestätigt!</h1>
      <p className="mt-2 text-zinc-700">
        Dein Detailreport wurde an dein Postfach gesendet. Bitte prüfe auch Spam oder Promotions.
      </p>

      <div className="mt-6 rounded-2xl border p-5 bg-white shadow-sm">
        <div className="text-lg font-semibold">Mini-Zusammenfassung</div>

        <div className="mt-2 text-zinc-800">
          <b>Score:</b> {score}/100
        </div>

        {strengths.length > 0 && (
          <div className="mt-4">
            <div className="font-semibold">Top-Stärken</div>
            <ul className="mt-2 list-disc pl-5 text-zinc-800">
              {strengths.slice(0, 3).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {copy?.headlines?.length ? (
          <div className="mt-4">
            <div className="font-semibold">Textvorschlag</div>
            <div className="mt-2 rounded-xl bg-zinc-50 border p-3 text-zinc-900">
              {copy.headlines[0]}
            </div>
          </div>
        ) : null}

        {seo.length > 0 && (
          <div className="mt-4">
            <div className="font-semibold">SEO Quick Win</div>
            <div className="mt-2 rounded-xl bg-zinc-50 border p-3">
              <div className="font-semibold">{seo[0].title}</div>
              <div className="text-zinc-700 mt-1">{seo[0].how}</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="text-lg font-bold text-blue-900">30-Tage AI Blueprint (199€)</div>
        <p className="mt-2 text-blue-900/90">
          Voller Umsetzungsplan: Struktur, Texte, CTA-Architektur, SEO-Seitenplan – personalisiert auf deinen Score.
        </p>

        <a
          href={blueprintHref}
          className={`inline-block mt-3 rounded-xl px-5 py-3 font-semibold text-white ${
            reportId ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-400 cursor-not-allowed"
          }`}
          aria-disabled={!reportId}
          onClick={(e) => {
            if (!reportId) e.preventDefault();
          }}
        >
          Blueprint freischalten →
        </a>

        {!reportId && (
          <div className="mt-2 text-sm text-blue-900/80">
            Hinweis: Report-ID fehlt. Öffne den Link aus deiner Bestätigungs-E-Mail erneut.
          </div>
        )}
      </div>
    </div>
  );
}