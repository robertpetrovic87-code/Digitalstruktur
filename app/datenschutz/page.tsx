export default function Datenschutz() {
  return (
    <div className="max-w-3xl mx-auto p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">Datenschutzerklärung</h1>

      <h2 className="text-lg font-semibold mt-6">1. Verantwortlicher</h2>
      <p>
        Robert Petrovic<br />
        Tschofenigweg 21<br />
        4030 Linz<br />
        Österreich<br />
        E-Mail: rp150@gmx.at
      </p>

      <h2 className="text-lg font-semibold mt-6">2. Verarbeitete Daten</h2>
      <p>
        Im Rahmen der Nutzung unseres Website-Analyse-Tools verarbeiten wir folgende Daten:
      </p>
      <ul className="list-disc ml-6 mt-2">
        <li>E-Mail-Adresse</li>
        <li>Eingegebene Website-URL</li>
        <li>Analyse-Ergebnisse</li>
        <li>Technische Zugriffsdaten (IP-Adresse, Browser, Server-Logs)</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6">3. Zweck der Verarbeitung</h2>
      <p>
        Die Verarbeitung erfolgt zur Bereitstellung von Website-Analysen,
        zur Zustellung von Analyse-Ergebnissen per E-Mail (Double-Opt-In)
        sowie zur Weiterentwicklung unseres Angebots.
      </p>

      <h2 className="text-lg font-semibold mt-6">4. Rechtsgrundlage</h2>
      <p>
        Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
        sowie bei Newsletter-Anmeldung gemäß Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
      </p>

      <h2 className="text-lg font-semibold mt-6">5. Hosting & Dienstleister</h2>
      <ul className="list-disc ml-6 mt-2">
        <li>Hosting: Vercel Inc.</li>
        <li>Datenbank: Supabase</li>
        <li>E-Mail-Versand: Resend</li>
        <li>KI-Verarbeitung: OpenAI</li>
        <li>Zahlungsabwicklung: Stripe</li>
      </ul>
      <p className="mt-2">
        Mit diesen Dienstleistern bestehen entsprechende Auftragsverarbeitungsverträge
        oder es erfolgt die Verarbeitung auf Grundlage geeigneter Garantien gemäß DSGVO.
      </p>

      <h2 className="text-lg font-semibold mt-6">6. Speicherdauer</h2>
      <p>
        Personenbezogene Daten werden nur so lange gespeichert,
        wie dies für die jeweiligen Zwecke erforderlich ist
        oder gesetzliche Aufbewahrungspflichten bestehen.
      </p>

      <h2 className="text-lg font-semibold mt-6">7. Newsletter</h2>
      <p>
        Für den Versand von E-Mails wird das Double-Opt-In-Verfahren verwendet.
        Sie können Ihre Einwilligung jederzeit widerrufen.
      </p>

      <h2 className="text-lg font-semibold mt-6">8. Tracking & Cookies</h2>
      <p>
        Aktuell werden keine Tracking- oder Marketing-Cookies eingesetzt.
        Sollten künftig Analyse- oder Marketing-Tools verwendet werden,
        erfolgt dies nur nach entsprechender Einwilligung.
      </p>

      <h2 className="text-lg font-semibold mt-6">9. Rechte der betroffenen Personen</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung,
        Einschränkung der Verarbeitung, Datenübertragbarkeit
        sowie Beschwerde bei der zuständigen Datenschutzbehörde.
      </p>

      <h2 className="text-lg font-semibold mt-6">10. Kontakt</h2>
      <p>
        Bei Fragen zum Datenschutz wenden Sie sich bitte an:
        rp150@gmx.at
      </p>
    </div>
  );
}