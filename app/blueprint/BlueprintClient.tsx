"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BlueprintClient() {
  const searchParams = useSearchParams();
  const rid = useMemo(() => searchParams.get("rid") ?? "", [searchParams]);
  const canceled = searchParams.get("canceled") === "1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!rid) {
      setError("Report ID fehlt. Bitte öffne den Link erneut aus deiner Analyse-Mail.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId: rid }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Checkout konnte nicht gestartet werden.");
        setLoading(false);
        return;
      }

      if (!data?.url) {
        setError("Stripe Checkout URL fehlt.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setError("Es ist ein Fehler aufgetreten. Bitte versuche es erneut.");
      setLoading(false);
    }
  }

  return (
<div className="min-h-screen bg-gradient-to-b from-white via-zinc-50 to-white">
<div className="mx-auto max-w-3xl px-6 py-14">

{/* PROBLEM HOOK */}

<div className="text-center">

<div className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
Website Blueprint
</div>

<h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
Die meisten Websites verlieren Anfragen
<br />
wegen kleiner Fehler
</h1>

<p className="mt-5 text-base leading-7 text-zinc-600">
Unklare Botschaft, schwache CTAs oder fehlendes Vertrauen sorgen dafür,
dass Besucher deine Seite verlassen ohne anzufragen.
</p>

<p className="mt-4 text-base leading-7 text-zinc-600">
Der Blueprint zeigt dir konkret,
<b className="text-zinc-900"> was du zuerst verbessern solltest</b>.
</p>

</div>

{/* CTA 1 */}

<button
onClick={handleCheckout}
disabled={loading}
className="mt-10 w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white transition-all duration-200 cursor-pointer hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-[2px] active:scale-[0.98]"
>
{loading ? "Weiterleitung..." : "Meinen Blueprint erstellen"}
</button>

<div className="mt-3 text-center text-sm text-zinc-500">
Einmalige Erstellung • Lieferung innerhalb 24h
</div>

{/* VALUE */}

<div className="mt-14 grid gap-5">

<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
<div className="font-semibold text-zinc-900">
Individuell für deine Website
</div>

<p className="mt-2 text-sm text-zinc-600">
Der Blueprint basiert auf deiner Analyse und zeigt dir genau,
welche Änderungen auf deiner Website die größte Wirkung haben.
</p>
</div>

<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
<div className="font-semibold text-zinc-900">
Konkrete nächste Schritte
</div>

<p className="mt-2 text-sm text-zinc-600">
Statt Theorie bekommst du klare Prioritäten:
was du zuerst ändern solltest und was später kommt.
</p>
</div>

<div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
<div className="font-semibold text-zinc-900">
Fokus auf Wirkung
</div>

<p className="mt-2 text-sm text-zinc-600">
Der Blueprint konzentriert sich auf Änderungen,
die direkt mehr Anfragen bringen können.
</p>
</div>

</div>

{/* WHAT YOU GET */}

<div className="mt-16 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

<h3 className="text-lg font-semibold text-zinc-900">
Was du bekommst
</h3>

<div className="mt-5 space-y-4 text-sm text-zinc-700">

<div className="flex items-start gap-3">
<div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-600"/>
<p>30-Tage Umsetzungsplan mit klaren Prioritäten</p>
</div>

<div className="flex items-start gap-3">
<div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-600"/>
<p>Conversion-Verbesserungen für mehr Anfragen</p>
</div>

<div className="flex items-start gap-3">
<div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-600"/>
<p>Struktur-Optimierungen für bessere Nutzerführung</p>
</div>

<div className="flex items-start gap-3">
<div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-600"/>
<p>SEO- und Content-Ideen</p>
</div>

<div className="flex items-start gap-3">
<div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-600"/>
<p>AI Prompts für bessere Website Texte</p>
</div>

</div>

</div>

{/* CTA 2 */}

<button
onClick={handleCheckout}
disabled={loading}
className="mt-12 w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white transition-all duration-200 cursor-pointer hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-[2px]"
>
{loading ? "Weiterleitung..." : "Blueprint jetzt erhalten"}
</button>

<div className="mt-3 text-center text-sm text-zinc-500">
Sichere Zahlung mit Stripe
</div>

{/* PREVIEW */}

<div className="mt-16 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

<h3 className="text-lg font-semibold text-zinc-900">
Beispiel Blueprint
</h3>

<div className="mt-6 space-y-5 text-sm text-zinc-700">

<div>
<div className="font-semibold text-zinc-900">Woche 1</div>
<ul className="mt-2 space-y-1">
<li>Hero klarer auf Nutzen ausrichten</li>
<li>wichtige CTA prominenter platzieren</li>
<li>Navigation vereinfachen</li>
</ul>
</div>

<div>
<div className="font-semibold text-zinc-900">Woche 2</div>
<ul className="mt-2 space-y-1">
<li>Vertrauen sichtbarer machen</li>
<li>Angebot klarer kommunizieren</li>
<li>Formulare vereinfachen</li>
</ul>
</div>

<div>
<div className="font-semibold text-zinc-900">Woche 3</div>
<ul className="mt-2 space-y-1">
<li>Content Struktur verbessern</li>
<li>SEO Seiten definieren</li>
<li>interne Verlinkung optimieren</li>
</ul>
</div>

</div>

</div>

{/* FINAL CTA */}

<button
onClick={handleCheckout}
disabled={loading}
className="mt-12 w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white transition-all duration-200 cursor-pointer hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-[2px]"
>
{loading ? "Weiterleitung..." : "Meinen Blueprint erstellen"}
</button>

<div className="mt-4 text-center text-sm text-zinc-500">
Einmalige Zahlung • Lieferung in 24 Stunden
</div>

<div className="mt-8 text-center text-xs text-zinc-400 break-all">
Report ID: {rid || "nicht gefunden"}
</div>

</div>
</div>
)
}