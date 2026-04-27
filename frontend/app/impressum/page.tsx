import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 flex-1 w-full">
        <h1 className="text-2xl font-bold mb-2">Impressum</h1>
        <p className="text-zinc-500 text-sm mb-10">Angaben gemäß § 5 TMG</p>

        <div className="space-y-8 text-zinc-400 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">Betreiber</h2>
            <p>
              Ziyad Issa Mohaman<br />
              Hinter der Platte 2<br />
              35463 Fernwald<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">Kontakt</h2>
            <p>E-Mail: kontakt@repvio.de</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Ziyad Issa Mohaman<br />
              Hinter der Platte 2<br />
              35463 Fernwald
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">
                ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mt-2">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
              Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen
              zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
