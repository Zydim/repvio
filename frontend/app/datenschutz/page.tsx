import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 flex-1 w-full">
        <h1 className="text-2xl font-bold mb-2">Datenschutzerklärung</h1>
        <p className="text-zinc-500 text-sm mb-10">Stand: März 2026</p>

        <div className="space-y-8 text-zinc-400 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">1. Datenschutz auf einen Blick</h2>
            <p>
              Die folgenden Hinweise geben einen Überblick darüber, was mit Ihren personenbezogenen
              Daten passiert, wenn Sie diese Website nutzen. Personenbezogene Daten sind alle Daten,
              mit denen Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">2. Verantwortliche Stelle</h2>
            <p>
              Ziyad Issa Mohaman<br />
              Hinter der Platte 2<br />
              35463 Fernwald<br />
              E-Mail: kontakt@repvio.de
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">3. Datenerfassung auf dieser Website</h2>
            <h3 className="font-medium text-zinc-300 mt-4 mb-1">Welche Daten werden erfasst?</h3>
            <p>Wir erfassen folgende personenbezogene Daten:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-500">
              <li>E-Mail-Adresse (bei Registrierung)</li>
              <li>Name (bei Registrierung)</li>
              <li>Hochgeladene Videos (für die Technik-Analyse)</li>
              <li>Analyse-Ergebnisse und Trainingshistorie</li>
              <li>Zahlungsdaten (werden über Stripe verarbeitet)</li>
            </ul>
            <h3 className="font-medium text-zinc-300 mt-4 mb-1">Wofür nutzen wir Ihre Daten?</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-500">
              <li>Bereitstellung der KI-Videoanalyse</li>
              <li>Verwaltung Ihres Benutzerkontos</li>
              <li>Speicherung Ihrer Trainingshistorie</li>
              <li>Abwicklung von Zahlungen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">4. Hosting</h2>
            <p>
              Diese Website wird bei Vercel Inc. gehostet. Die Server befinden sich in der EU
              und den USA. Vercel verarbeitet Daten in unserem Auftrag und ist vertraglich
              verpflichtet, die Datenschutzbestimmungen einzuhalten.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">5. KI-Videoanalyse (Claude Vision)</h2>
            <p>
              Hochgeladene Videos werden zur Analyse an die API von Anthropic (Claude Vision)
              übermittelt. Dabei werden einzelne Frames des Videos extrahiert und verarbeitet.
              Die Videos werden nicht dauerhaft bei Anthropic gespeichert.
            </p>
            <p className="mt-2">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">6. Zahlungsabwicklung (Stripe)</h2>
            <p>
              Zahlungen werden über Stripe Inc. abgewickelt. Stripe verarbeitet Ihre Zahlungsdaten
              auf eigenen Servern. Wir haben keinen Zugriff auf vollständige Zahlungsdaten.
            </p>
            <p className="mt-2">
              Stripe Datenschutzrichtlinie:{" "}
              <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">
                stripe.com/de/privacy
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">7. Cookies</h2>
            <p>
              Wir verwenden technisch notwendige Cookies für die Authentifizierung (Login-Session).
              Diese Cookies sind für den Betrieb der Website erforderlich und können nicht deaktiviert werden.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">8. Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht auf:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-500">
              <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="mt-2">Zur Ausübung Ihrer Rechte wenden Sie sich an: kontakt@repvio.de</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">9. Datenlöschung</h2>
            <p>
              Wenn Sie Ihr Konto löschen möchten, kontaktieren Sie uns unter kontakt@repvio.de.
              Wir löschen dann alle Ihre personenbezogenen Daten, einschließlich Trainingshistorie und hochgeladene Videos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">10. Änderungen</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die aktuelle Version finden Sie stets auf dieser Seite.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
