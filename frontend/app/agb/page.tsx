import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 flex-1 w-full prose prose-invert prose-sm max-w-none">
        <h1 className="text-2xl font-bold mb-6">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p className="text-zinc-500 text-sm mb-8">Stand: März 2026</p>

        <h2 className="text-lg font-semibold mt-8 mb-3">1. Geltungsbereich</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Webapplikation Repvio (repvio.app / repvio.de), betrieben von Ziyad Issa Mohaman, Hinter der Platte 2, 35463 Fernwald. Die AGB gelten gegenüber Verbrauchern und Unternehmern.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">2. Leistungsbeschreibung</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Repvio ist ein KI-gestützter Dienst zur Analyse von Trainingsvideos. Nutzer können Videos hochladen und erhalten automatisiertes Feedback zur Ausführungstechnik. Das Feedback dient ausschließlich als Trainingsassistenz und stellt keine medizinische, therapeutische oder sportmedizinische Beratung dar.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">3. Haftungsausschluss</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Die KI-generierten Analysen sind nicht als Ersatz für professionelle Beratung durch Trainer, Physiotherapeuten oder Ärzte zu verstehen. Repvio übernimmt keine Haftung für Verletzungen, die aus der Nutzung des Dienstes entstehen. Die Nutzung erfolgt auf eigene Gefahr.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">4. Abonnements und Zahlungen</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Repvio bietet kostenpflichtige Abonnements (Pro, Elite) an. Die Abrechnung erfolgt monatlich über Stripe. Abonnements verlängern sich automatisch, sofern sie nicht vor dem nächsten Abrechnungszeitraum gekündigt werden. Zur Kündigung wende dich an support@repvio.app.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">5. Widerrufsrecht</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Verbraucher haben das Recht, innerhalb von 14 Tagen ohne Angabe von Gründen zu widerrufen. Das Widerrufsrecht erlischt bei digitalen Inhalten, sobald mit der Ausführung begonnen wurde und der Verbraucher ausdrücklich zugestimmt hat. Zur Ausübung des Widerrufs wende dich an support@repvio.app.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">6. Nutzungsrechte</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Hochgeladene Videos werden ausschließlich zur Analyse verwendet und nicht dauerhaft gespeichert oder an Dritte weitergegeben. Du behältst alle Rechte an deinen hochgeladenen Inhalten.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">7. Schlussbestimmungen</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Betreibers. Änderungen der AGB werden per E-Mail bekanntgegeben.
        </p>

        <div className="mt-10 pt-6 border-t border-zinc-800">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">← Zurück zur Startseite</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
