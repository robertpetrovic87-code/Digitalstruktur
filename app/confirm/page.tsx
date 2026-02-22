export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import ConfirmClient from "./ConfirmClient";

type PageProps = {
  searchParams?: { token?: string };
};

export default function ConfirmPage({ searchParams }: PageProps) {
  const tokenRaw = searchParams?.token;
  const token = tokenRaw && tokenRaw.trim().length > 0 ? tokenRaw.trim() : null;

  return <ConfirmClient token={token} />;
}