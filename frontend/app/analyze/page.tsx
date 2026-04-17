"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import VideoUploader from "@/components/VideoUploader";
import FeedbackCard from "@/components/FeedbackCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  { id: "Step Up Kabelzug", label: "Step Up Kabel", emoji: "🪜" },
  { id: "Bulgarian Split Squat", label: "Bulgarian SS", emoji: "🦿" },
  { id: "Rudern Kabelzug", label: "Rudern Kabel", emoji: "🚣" },
  { id: "Rumänisches Kreuzheben", label: "RDL", emoji: "🏋️‍♀️" },
  { id: "Ausfallschritte", label: "Ausfallschritte", emoji: "🚶" },
];

const MUSCLE_FOCUS: Record<string, string[]> = {
  "Schrägbankdrücken":        ["Obere Brust", "Brust allgemein"],
  "Dips":                     ["Brust", "Trizeps"],
  "Klimmzüge":                ["Latissimus / Rücken"],
  "Muscle-Ups":               ["Gesamtkette"],
  "Chin-Ups":                 ["Latissimus / Rücken", "Bizeps"],
  "Seitheben Kabelturm":      ["Mittlerer Deltamuskel"],
  "Schulterpress Langhantel": ["Vordere / Mittlere Schulter"],
  "Kniebeuge":                ["Quadrizeps", "Gesäß / Glutes", "Gesamt (Beine + Core)"],
  "Kreuzheben":               ["Gesäß / Hamstrings", "Gesamt"],
  "Hip Thrust":               ["Gesäß / Glutes", "Hamstrings"],
  "Face Pulls Kabelturm":     ["Hintere Schulter"],
  "Step Up Kabelzug":         ["Quadrizeps", "Gesäß / Glutes", "Gesamt (Beine + Core)"],
  "Bulgarian Split Squat":    ["Quadrizeps", "Gesäß / Glutes", "Hamstrings"],
  "Rudern Kabelzug":          ["Latissimus / Rücken", "Hintere Schulter / Rhomboids"],
  "Rumänisches Kreuzheben":   ["Gesäß / Glutes", "Hamstrings"],
  "Ausfallschritte":          ["Quadrizeps", "Gesäß / Glutes"],
};

export default function AnalyzePage() {
  const { data: session } = useSession();
  const [exercise, setExercise] = useState<string | null>(null);
  const [muscleFocus, setMuscleFocus] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const userEmail = session?.user?.email ?? "";

  function handleResult(res: AnalysisResponse) {
    setResult(res);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12 flex-1">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Technik analysieren</h1>
        <p className="text-zinc-400 mb-8 md:mb-10 text-sm md:text-base">
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
          <div>
            {/* Exercise selection */}
            <div className="mb-8">
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-3">
                Übung wählen
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                {EXERCISES.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setExercise(ex.id);
                      const opts = MUSCLE_FOCUS[ex.id];
                      setMuscleFocus(opts?.length === 1 ? opts[0] : null);
                    }}
                    className={`flex flex-col items-center gap-1.5 md:gap-2 py-3 md:py-5 rounded-2xl border-2 transition-all text-xs md:text-sm font-medium ${
                      exercise === ex.id
                        ? "border-white bg-zinc-800 text-white"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xl md:text-2xl">{ex.emoji}</span>
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Muscle Focus */}
            {exercise && MUSCLE_FOCUS[exercise] && MUSCLE_FOCUS[exercise].length > 1 && (
              <div className="mb-8">
                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-3">
                  Welchen Muskel möchtest du trainieren?
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_FOCUS[exercise].map((muscle) => (
                    <button
                      key={muscle}
                      onClick={() => setMuscleFocus(muscle)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        muscleFocus === muscle
                          ? "border-white bg-white text-zinc-950"
                          : "border-zinc-600 bg-zinc-900 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Camera Guide */}
            {exercise && (
              <div className="mb-6 bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3 font-semibold">📷 Tipps für beste Ergebnisse</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>Von der <strong>Seite</strong> filmen (nicht frontal)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span><strong>Ganzer Körper</strong> im Bild sichtbar</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span><strong>Gutes Licht</strong> — kein Gegenlicht</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>Mindestens <strong>2-3 Wiederholungen</strong> im Video</span>
                  </div>
                </div>
              </div>
            )}

            {/* Uploader */}
            {exercise ? (
              <VideoUploader
                exerciseType={exercise}
                muscleFocus={muscleFocus}
                userEmail={userEmail}
                onResult={handleResult}
              />
            ) : (
              <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-6 md:p-10 text-center text-zinc-600 text-sm">
                Bitte zuerst eine Übung auswählen
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
