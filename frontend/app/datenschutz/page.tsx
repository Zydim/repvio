import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Repvio
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          Zurück
        </Link>

        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">1. Datenschutz auf einen Blick</h2>
            <p>
              Die folgenden Hinweise geben einen Überblick darüber, was mit Ihren personenbezogenen
              Daten passiert, wenn Sie diese Website nutzen. Personenbezogene Daten sind alle Daten,
              mit denen Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">2. Verantwortliche Stelle</h2>
            <p>
              Ziyad [Nachname]<br />
              [Straße Hausnummer]<br />
              [PLZ Ort]<br />
              E-Mail: kontakt@repvio.de
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">3. Datenerfassung auf dieser Website</h2>
            <h3 className="font-medium text-zinc-200 mt-4 mb-1">Welche Daten werden erfasst?</h3>
            <p>Wir erfassen folgende personenbezogene Daten:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>E-Mail-Adresse (bei Registrierung)</li>
              <li>Name (bei Registrierung)</li>
              <li>Hochgeladene Videos (für die Technik-Analyse)</li>
              <li>Analyse-Ergebnisse und Trainingshistorie</li>
              <li>Zahlungsdaten (werden über Stripe verarbeitet)</li>
            </ul>

            <h3 className="font-medium text-zinc-200 mt-4 mb-1">Wofür nutzen wir Ihre Daten?</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>Bereitstellung der KI-Videoanalyse</li>
              <li>Verwaltung Ihres Benutzerkontos</li>
              <li>Speicherung Ihrer Trainingshistorie</li>
              <li>Abwicklung von Zahlungen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">4. Hosting</h2>
            <p>
              Diese Website wird bei Vercel Inc. gehostet. Die Server befinden sich in der EU
              und den USA. Vercel verarbeitet Daten in unserem Auftrag und ist vertraglich
              verpflichtet, die Datenschutzbestimmungen einzuhalten.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">5. KI-Videoanalyse (Claude Vision)</h2>
            <p>
              Hochgeladene Videos werden zur Analyse an die API von Anthropic (Claude Vision)
              übermittelt. Dabei werden einzelne Frames des Videos extrahiert und verarbeitet.
              Die Videos werden nicht dauerhaft bei Anthropic gespeichert.
            </p>
            <p className="mt-2">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">6. Zahlungsabwicklung (Stripe)</h2>
            <p>
              Zahlungen werden über Stripe Inc. abgewickelt. Stripe verarbeitet Ihre Zahlungsdaten
              (Kreditkartennummer, Ablaufdatum, CVC) auf eigenen Servern. Wir haben keinen Zugriff
              auf vollständige Zahlungsdaten.
            </p>
            <p className="mt-2">
              Stripe Datenschutzrichtlinie:{" "}
              <a
                href="https://stripe.com/de/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                https://stripe.com/de/privacy
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">7. Cookies</h2>
            <p>
              Wir verwenden technisch notwendige Cookies für die Authentifizierung (Login-Session).
              Diese Cookies sind für den Betrieb der Website erforderlich und können nicht
              deaktiviert werden.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">8. Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht auf:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
              <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="mt-2">
              Zur Ausübung Ihrer Rechte wenden Sie sich an: kontakt@repvio.de
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">9. Datenlöschung</h2>
            <p>
              Wenn Sie Ihr Konto löschen möchten, kontaktieren Sie uns unter kontakt@repvio.de.
              Wir löschen dann alle Ihre personenbezogenen Daten, einschließlich Trainingshistorie
              und hochgeladene Videos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">10. Änderungen</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
              Rechtslagen oder Änderungen des Dienstes anzupassen. Die aktuelle Version finden
              Sie stets auf dieser Seite.
            </p>
            <p className="mt-2 text-zinc-500">Stand: März 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
