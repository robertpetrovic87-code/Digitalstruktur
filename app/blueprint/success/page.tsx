// app/blueprint/success/page.tsx
import SuccessClient from "./SuccessClient";

export default function BlueprintSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; rid?: string };
}) {
  const rid = searchParams.rid;

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold">✅ Zahlung erfolgreich</h1>
      <p className="mt-3 text-zinc-700">Danke! Dein Blueprint wird jetzt erstellt.</p>

      <div className="mt-6 rounded-2xl border p-5 bg-white">
        <div className="text-sm text-zinc-500">Session ID</div>
        <div className="font-mono text-sm break-all">{searchParams.session_id ?? "—"}</div>
      </div>

      {rid ? (
        <>
          <SuccessClient rid={rid} />
          <a className="inline-block mt-6 underline" href={`/blueprint?rid=${encodeURIComponent(rid)}`}>
            Zurück zum Blueprint →
          </a>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border p-5 bg-white">
          <div className="font-semibold">⚠️ Report ID fehlt</div>
          <p className="text-sm text-zinc-600 mt-2">
            Bitte öffne den Blueprint-Link erneut aus der E-Mail / Checkout-URL.
          </p>
        </div>
      )}
    </div>
  );
}