"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import VideoUploader from "@/components/VideoUploader";
import FeedbackCard from "@/components/FeedbackCard";
import PlanBadge from "@/components/PlanBadge";
import { AnalysisResponse } from "@/lib/api";

const EXERCISES = [
  { id: "Bankdrücken", label: "Bankdrücken", emoji: "🏋️" },
  { id: "Schrägbankdrücken", label: "Schrägbank", emoji: "📐" },
  { id: "Dips", label: "Dips", emoji: "💪" },
  { id: "Klimmzüge", label: "Klimmzüge", emoji: "🔼" },
  { id: "Muscle-Ups", label: "Muscle-Ups", emoji: "⚡" },
  { id: "Chin-Ups", label: "Chin-Ups", emoji: "🤸" },
  { id: "Seitheben Kabelturm", label: "Seitheben Kabel", emoji: "🔁" },
  { id: "Schulterpress Langhantel", label: "Schulterpress LH", emoji: "🔝" },
  { id: "Kniebeuge", label: "Kniebeuge", emoji: "🦵" },
  { id: "Kreuzheben", label: "Kreuzheben", emoji: "🏗️" },
  { id: "Hip Thrust", label: "Hip Thrust", emoji: "🍑" },
  { id: "Face Pulls Kabelturm", label: "Face Pulls", emoji: "🎯" },
];

export default function AnalyzePage() {
  const { data: session } = useSession();
  const [exercise, setExercise] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const userEmail = session?.user?.email ?? "";

  function handleResult(res: AnalysisResponse) {
    setResult(res);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Repvio
        </Link>
        <div className="flex items-center gap-4">
          <PlanBadge />
          <Link href="/pricing" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Technik analysieren</h1>
        <p className="text-zinc-400 mb-10">
          Wähle deine Übung und lade ein Video hoch.
        </p>

        {/* Result */}
        {result && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Dein Feedback</h2>
              <button
                onClick={() => setResult(null)}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                Neue Analyse
              </button>
            </div>
            <FeedbackCard {...result.feedback} />
          </div>
        )}

        {!result && (
          <>
            {/* Exercise selection */}
            <div className="mb-8">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-3">
                Übung wählen
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EXERCISES.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setExercise(ex.id)}
                    className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all text-sm font-medium ${
                      exercise === ex.id
                        ? "border-white bg-zinc-800 text-white"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-2xl">{ex.emoji}</span>
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Uploader */}
            {exercise ? (
              <VideoUploader
                exerciseType={exercise}
                userEmail={userEmail}
                onResult={handleResult}
              />
            ) : (
              <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-10 text-center text-zinc-600 text-sm">
                Bitte zuerst eine Übung auswählen
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
