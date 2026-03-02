export const dynamic = "force-dynamic";
export const revalidate = 0;

import BlueprintClient from "./BlueprintClient";

type PageProps = {
  searchParams?: { rid?: string | string[] };
};

export default function BlueprintPage({ searchParams }: PageProps) {
  const ridRaw = searchParams?.rid;

  const rid =
    Array.isArray(ridRaw) ? ridRaw[0] : typeof ridRaw === "string" ? ridRaw : "";

  // Safety: falls irgendwer "/blueprint" o.ä. anhängt
  const cleaned = rid.split("/")[0].trim();

  const reportId = cleaned.length > 0 ? cleaned : null;

  return <BlueprintClient reportId={reportId} />;
}