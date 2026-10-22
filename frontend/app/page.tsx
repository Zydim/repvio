"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Video, BarChart2, TrendingUp, Star, Shield, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-[#08080f] text-white overflow-x-hidden">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-4 md:px-6 py-24 md:py-40">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#0066ff]/40 bg-[#0066ff]/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
            <span className="text-xs text-[#4d94ff] font-semibold uppercase tracking-wider">Video-Analyse für Athleten</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            Bessere Technik.
            <br />
            <span className="text-[#0066ff]">Schnellere Ergebnisse.</span>
          </h1>

          <p className="text-base md:text-lg text-zinc-400 max-w-md mb-10 leading-relaxed">
            Lade dein Trainings-Video hoch — und bekomme in Sekunden detailliertes Feedback zu deiner Technik.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href={isLoggedIn ? "/analyze" : "/login"}
              className="px-8 py-3.5 rounded-full text-base font-bold text-white bg-[#0066ff] hover:bg-[#0052cc] transition-colors duration-200 text-center"
            >
              {isLoggedIn ? "Jetzt analysieren" : "Kostenlos starten"}
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-full text-base font-semibold text-zinc-300 border border-white/10 hover:border-white/30 hover:text-white transition-colors duration-200 text-center"
            >
              Preise ansehen
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 pb-20 md:pb-28">
          <p className="text-xs uppercase tracking-widest text-[#0066ff] font-bold text-center mb-3">So funktioniert&apos;s</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">In 3 Schritten zur besseren Technik</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white/4 border border-white/8 hover:border-[#0066ff]/50 rounded-2xl p-6 transition-colors duration-300">
              <div className="w-10 h-10 bg-[#0066ff] rounded-xl flex items-center justify-center mb-5">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-white">1. Video hochladen</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Filme dein Set von der Seite — Kniebeuge, Bankdrücken, Kreuzheben und 17 weitere Übungen.
              </p>
            </div>
            <div className="bg-white/4 border border-white/8 hover:border-[#0066ff]/50 rounded-2xl p-6 transition-colors duration-300">
              <div className="w-10 h-10 bg-[#0066ff] rounded-xl flex items-center justify-center mb-5">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-white">2. Technik wird analysiert</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Jede Bewegung wird Frame für Frame bewertet — Haltung, Gelenke, Bewegungsumfang, Fluss.
              </p>
            </div>
            <div className="bg-white/4 border border-white/8 hover:border-[#0066ff]/50 rounded-2xl p-6 transition-colors duration-300">
              <div className="w-10 h-10 bg-[#0066ff] rounded-xl flex items-center justify-center mb-5">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-white">3. Fortschritt verfolgen</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Deine Sessions werden gespeichert — sieh wie deine Technik über Wochen besser wird.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/6 py-12 md:py-16 bg-white/2">
          <div className="max-w-4xl mx-auto px-4 md:px-6 grid grid-cols-3 gap-4 md:gap-8 text-center">
            <div>
              <p className="text-2xl md:text-4xl font-extrabold text-[#0066ff]">20</p>
              <p className="text-xs md:text-sm text-zinc-500 mt-2">Übungen unterstützt</p>
            </div>
            <div>
              <p className="text-2xl md:text-4xl font-extrabold text-[#0066ff]">&lt; 30s</p>
              <p className="text-xs md:text-sm text-zinc-500 mt-2">bis zum Feedback</p>
            </div>
            <div>
              <p className="text-2xl md:text-4xl font-extrabold text-[#0066ff]">0–100</p>
              <p className="text-xs md:text-sm text-zinc-500 mt-2">Technik-Score</p>
            </div>
          </div>
        </section>

        {/* Why Repvio */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="text-xs uppercase tracking-widest text-[#0066ff] font-bold text-center mb-3">Warum Repvio?</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Trainiere wie ein Profi. Ohne Trainer.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/6 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Star className="w-5 h-5 text-[#0066ff]" />
              </div>
              <h3 className="font-bold mb-2">Präzises Feedback</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Erkennt Fehler die du selbst nicht siehst — Kniestellung, Rückenposition, Tiefe.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/6 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Shield className="w-5 h-5 text-[#0066ff]" />
              </div>
              <h3 className="font-bold mb-2">Verletzungsprävention</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Jede Analyse enthält eine Risikobewertung für häufige Verletzungsquellen.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/6 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Zap className="w-5 h-5 text-[#0066ff]" />
              </div>
              <h3 className="font-bold mb-2">Sofort-Ergebnisse</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Kein Warten auf einen Trainer. Feedback in unter 30 Sekunden, rund um die Uhr.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 text-center px-4 border-t border-white/6">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Bereit für bessere Technik?</h2>
          <p className="text-zinc-400 mb-10 max-w-sm mx-auto text-sm md:text-base leading-relaxed">
            Starte kostenlos mit 3 Video-Analysen pro Monat. Kein Abo nötig.
          </p>
          <Link
            href={isLoggedIn ? "/analyze" : "/login"}
            className="inline-block px-10 py-4 rounded-full text-base font-bold text-white bg-[#0066ff] hover:bg-[#0052cc] transition-colors duration-200"
          >
            {isLoggedIn ? "Jetzt analysieren" : "Kostenlos starten"}
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
