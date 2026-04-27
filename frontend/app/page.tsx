"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Video, Brain, TrendingUp, Star, Shield, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center text-center px-4 md:px-6 py-20 md:py-36">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
          </div>

          {/* Badge */}
          <div className="relative inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-300 font-medium">KI-Technik-Analyse in Sekunden</span>
          </div>

          {/* Headline */}
          <h1 className="relative text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            Werde stärker.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Trainiere smarter.
            </span>
          </h1>

          <p className="relative text-base md:text-lg text-zinc-400 max-w-md mb-10 leading-relaxed">
            Lade dein Training-Video hoch und erhalte sofortiges KI-Feedback zu deiner Technik — in Sekunden.
          </p>

          {/* CTA */}
          <div className="relative flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href={isLoggedIn ? "/analyze" : "/login"}
              className="relative group px-8 py-3.5 rounded-full text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all duration-200 shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] text-center"
            >
              {isLoggedIn ? "Jetzt analysieren" : "Kostenlos starten"}
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 pb-16 md:pb-24">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold text-center mb-3">So funktioniert&apos;s</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-12">In 3 Schritten zur perfekten Technik</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {/* Card 1 */}
            <div className="group bg-zinc-900/60 border border-zinc-800 hover:border-violet-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]">
              <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-violet-400 rounded-xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-zinc-100">1. Video hochladen</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Lade .mp4 oder .mov hoch. Kniebeuge, Bankdrücken, Kreuzheben und mehr werden unterstützt.
              </p>
            </div>
            {/* Card 2 */}
            <div className="group bg-zinc-900/60 border border-zinc-800 hover:border-blue-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-zinc-100">2. KI analysiert</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Unsere KI analysiert deine Bewegung Frame für Frame und gibt dir detailliertes Technik-Feedback mit Score.
              </p>
            </div>
            {/* Card 3 */}
            <div className="group bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold mb-2 text-zinc-100">3. Fortschritt tracken</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Deine Trainingshistorie wird gespeichert. Verfolge deinen Fortschritt über Zeit.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-zinc-800/60 py-12 md:py-16 bg-zinc-900/20">
          <div className="max-w-4xl mx-auto px-4 md:px-6 grid grid-cols-3 gap-4 md:gap-8 text-center">
            <div>
              <p className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">6 Frames</p>
              <p className="text-xs md:text-sm text-zinc-500 mt-2">pro Video analysiert</p>
            </div>
            <div>
              <p className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">&lt; 30 Sek</p>
              <p className="text-xs md:text-sm text-zinc-500 mt-2">für detailliertes Feedback</p>
            </div>
            <div>
              <p className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">0–100</p>
              <p className="text-xs md:text-sm text-zinc-500 mt-2">Technik-Score pro Analyse</p>
            </div>
          </div>
        </section>

        {/* Why Repvio */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold text-center mb-3">Warum Repvio?</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Dein KI-Trainer. Immer dabei.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_24px_rgba(245,158,11,0.3)]">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold mb-2">Präzises Feedback</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                KI erkennt Fehler, die du selbst nicht siehst — Kniestellung, Rückenposition, Tiefe.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold mb-2">Verletzungsprävention</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Jede Analyse enthält eine Risikobewertung für häufige Verletzungsquellen.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_24px_rgba(99,102,241,0.3)]">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold mb-2">Sofort-Ergebnisse</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Kein Warten auf einen Trainer. Feedback in unter 30 Sekunden, rund um die Uhr.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 md:py-24 text-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-zinc-950 to-blue-950/40" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[300px] rounded-full bg-violet-600/10 blur-[100px]" />
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Bereit für bessere Technik?</h2>
            <p className="text-zinc-400 mb-10 max-w-sm mx-auto text-sm md:text-base leading-relaxed">
              Starte kostenlos mit 3 Video-Analysen pro Monat. Kein Abo nötig.
            </p>
            <Link
              href={isLoggedIn ? "/analyze" : "/login"}
              className="inline-block px-10 py-4 rounded-full text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all duration-200 shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_55px_rgba(139,92,246,0.6)]"
            >
              {isLoggedIn ? "Jetzt analysieren" : "Kostenlos starten"}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
