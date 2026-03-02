export const dynamic = "force-dynamic";
export const revalidate = 0;

import BlueprintClient from "./BlueprintClient";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function BlueprintPage({ searchParams }: PageProps) {
  const ridRaw = searchParams?.rid;

  const rid =
    Array.isArray(ridRaw) ? ridRaw[0] : typeof ridRaw === "string" ? ridRaw : "";

  const cleaned = rid.split("/")[0].trim();
  const reportId = cleaned.length > 0 ? cleaned : null;

  // ✅ Fingerprint: wenn du DAS nicht siehst, rendert nicht diese Datei
  const fingerprint = "BLUEPRINT_PAGE_V3";

  return (
    <>
      {/* Debug nur kurz drin lassen */}
      <div className="max-w-3xl mx-auto px-8 pt-4 text-xs text-zinc-500">
        {fingerprint} · ridRaw:{" "}
        <span className="font-mono">{Array.isArray(ridRaw) ? `[${ridRaw.join(",")}]` : ridRaw ?? "—"}</span>
        {" · "}cleaned: <span className="font-mono">{cleaned || "—"}</span>
        {" · "}reportId: <span className="font-mono">{reportId ?? "NULL"}</span>
      </div>

      <BlueprintClient reportId={reportId} />
    </>
  );
}