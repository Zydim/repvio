"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Video, Brain, TrendingUp, Star, Shield, Zap } from "lucide-react";
import PlanBadge from "@/components/PlanBadge";

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <span className="text-xl font-bold tracking-tight">Repvio</span>
        <div className="flex gap-4 items-center">
          {isLoggedIn && <PlanBadge />}
          <Link href="/pricing" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Pricing
          </Link>
          {isLoggedIn && (
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Dashboard
            </Link>
          )}
          <Link
            href="/analyze"
            className="text-sm bg-white text-zinc-950 px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Analysieren
          </Link>
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Abmelden
            </button>
          ) : (
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Anmelden
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 mb-8">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-zinc-400">Powered by Claude Vision AI</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          Werde stärker.
          <br />
          <span className="text-zinc-400">Trainiere smarter.</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-lg mb-10">
          Lade dein Training-Video hoch und erhalte sofortiges KI-Feedback zu deiner Technik — in Sekunden.
        </p>
        <div className="flex gap-4">
          <Link
            href={isLoggedIn ? "/analyze" : "/login"}
            className="bg-white text-zinc-950 px-8 py-3 rounded-full text-base font-semibold hover:bg-zinc-200 transition-colors"
          >
            {isLoggedIn ? "Jetzt analysieren" : "Kostenlos starten"}
          </Link>
          <Link
            href="/pricing"
            className="border border-zinc-700 text-zinc-300 px-8 py-3 rounded-full text-base font-semibold hover:bg-zinc-900 transition-colors"
          >
            Pläne ansehen
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">So funktioniert&apos;s</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
              <Video className="w-5 h-5 text-zinc-300" />
            </div>
            <h3 className="font-semibold mb-2">1. Video hochladen</h3>
            <p className="text-sm text-zinc-400">
              Lade .mp4 oder .mov hoch. Kniebeuge, Bankdrücken, Kreuzheben und mehr werden unterstützt.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-5 h-5 text-zinc-300" />
            </div>
            <h3 className="font-semibold mb-2">2. KI analysiert</h3>
            <p className="text-sm text-zinc-400">
              Claude Vision extrahiert 6 Frames und gibt dir detailliertes Technik-Feedback mit Score.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-zinc-300" />
            </div>
            <h3 className="font-semibold mb-2">3. Fortschritt tracken</h3>
            <p className="text-sm text-zinc-400">
              Deine Trainingshistorie wird gespeichert. Verfolge deinen Fortschritt über Zeit.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 py-16">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold">6 Frames</p>
            <p className="text-sm text-zinc-400 mt-1">pro Video analysiert</p>
          </div>
          <div>
            <p className="text-3xl font-bold">&lt; 30 Sek</p>
            <p className="text-sm text-zinc-400 mt-1">für detailliertes Feedback</p>
          </div>
          <div>
            <p className="text-3xl font-bold">0–100</p>
            <p className="text-sm text-zinc-400 mt-1">Technik-Score pro Analyse</p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-10">Warum Repvio?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-semibold mb-2">Präzises Feedback</h3>
            <p className="text-sm text-zinc-400">
              KI erkennt Fehler, die du selbst nicht siehst — Kniestellung, Rückenposition, Tiefe.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold mb-2">Verletzungsprävention</h3>
            <p className="text-sm text-zinc-400">
              Jede Analyse enthält eine Risikobewertung für häufige Verletzungsquellen.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Sofort-Ergebnisse</h3>
            <p className="text-sm text-zinc-400">
              Kein Warten auf einen Trainer. Feedback in unter 30 Sekunden, rund um die Uhr.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-zinc-900 border-t border-zinc-800 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Bereit für bessere Technik?</h2>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
          Starte kostenlos mit 3 Video-Analysen pro Monat. Kein Abo nötig.
        </p>
        <Link
          href={isLoggedIn ? "/analyze" : "/login"}
          className="bg-white text-zinc-950 px-8 py-3 rounded-full text-base font-semibold hover:bg-zinc-200 transition-colors"
        >
          {isLoggedIn ? "Jetzt analysieren" : "Kostenlos starten"}
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">© 2026 Repvio. Alle Rechte vorbehalten.</span>
          <div className="flex gap-6">
            <Link href="/impressum" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              Datenschutz
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
