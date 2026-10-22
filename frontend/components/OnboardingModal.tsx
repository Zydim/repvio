"use client";

import { useState, useEffect } from "react";
import { X, Camera, Trophy, TrendingUp } from "lucide-react";

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("repvio_onboarded");
    if (!seen) setOpen(true);
  }, []);

  function close() {
    localStorage.setItem("repvio_onboarded", "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#0f0f18] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Willkommen bei Repvio 👋</h2>
          <button onClick={close} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-5">
          <div className="flex gap-3">
            <Camera className="w-5 h-5 text-[#4d94ff] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Übung wählen & Video hochladen</p>
              <p className="text-xs text-zinc-500">Film 2–3 Wiederholungen von der Seite · max. 15 Sekunden · Handy auf Hüfthöhe</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Trophy className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Deine Technik wird bewertet</p>
              <p className="text-xs text-zinc-500">Du bekommst einen Score + konkrete Hinweise was du verbessern kannst</p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Fortschritt im Dashboard</p>
              <p className="text-xs text-zinc-500">Verfolge wie dein Score über die Zeit steigt</p>
            </div>
          </div>
        </div>

        {/* Score-Skala */}
        <div className="bg-white/4 border border-white/8 rounded-xl p-4 mb-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-semibold">Was bedeutet dein Score?</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-400">90 – 99</span>
              <span className="text-zinc-400">Elite-Technik 🏆</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-500">80 – 89</span>
              <span className="text-zinc-400">Sehr gute Technik ✅</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-yellow-400">65 – 79</span>
              <span className="text-zinc-400">Solide Grundtechnik 📈</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-orange-400">50 – 64</span>
              <span className="text-zinc-400">Mehrere Verbesserungspunkte</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-red-400">&lt; 50</span>
              <span className="text-zinc-400">Grundlegende Probleme</span>
            </div>
          </div>
        </div>

        <button
          onClick={close}
          className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#0066ff] hover:bg-[#0052cc] transition-colors"
        >
          Los geht&apos;s!
        </button>
      </div>
    </div>
  );
}
