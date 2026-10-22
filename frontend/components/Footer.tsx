import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-6 md:py-8 px-4 md:px-8 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-zinc-500">&copy; 2026 Repvio. Alle Rechte vorbehalten.</span>
          <span className="text-xs text-zinc-600">Technik-Analyse · Kein Ersatz für medizinische Beratung</span>
        </div>
        <div className="flex gap-6">
          <Link href="/impressum" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Impressum
          </Link>
          <Link href="/datenschutz" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Datenschutz
          </Link>
          <Link href="/agb" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            AGB
          </Link>
        </div>
      </div>
    </footer>
  );
}
