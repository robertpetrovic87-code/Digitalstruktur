export const dynamic = "force-dynamic";
export const revalidate = 0;

import BlueprintClient from "./BlueprintClient";

type PageProps = {
  searchParams?: { rid?: string };
};

export default function BlueprintPage({ searchParams }: PageProps) {
  const rid = searchParams?.rid?.trim();
  const reportId = rid && rid.length > 0 ? rid : null;

  return <BlueprintClient reportId={reportId} />;
}