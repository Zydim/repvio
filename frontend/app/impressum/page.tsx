import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ImpressumPage() {
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

        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Angaben gemäß § 5 TMG</h2>
            <p>
              Ziyad [Nachname]<br />
              [Straße Hausnummer]<br />
              [PLZ Ort]<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Kontakt</h2>
            <p>
              E-Mail: kontakt@repvio.de
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
              [USt-IdNr. eintragen, falls vorhanden]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Ziyad [Nachname]<br />
              [Straße Hausnummer]<br />
              [PLZ Ort]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-2">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
              Tätigkeit hinweisen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
