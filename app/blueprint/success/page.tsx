export default function BlueprintSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold">✅ Zahlung erfolgreich</h1>
      <p className="mt-3 text-zinc-700">
        Danke! Dein Blueprint wird jetzt erstellt.
      </p>

      <div className="mt-6 rounded-2xl border p-5 bg-white">
        <div className="text-sm text-zinc-500">Session ID</div>
        <div className="font-mono text-sm break-all">{searchParams.session_id ?? "—"}</div>
      </div>

      <p className="mt-6 text-zinc-700">
        Als nächstes bauen wir: Automatische Blueprint-Generierung + Versand per E-Mail.
      </p>
    </div>
  );
}