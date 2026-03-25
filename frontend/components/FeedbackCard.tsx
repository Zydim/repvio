"use client";

import { CheckCircle, AlertTriangle, Zap, ShieldAlert, ArrowRight } from "lucide-react";
import { FeedbackResult } from "@/lib/api";

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-green-400 stroke-green-400"
      : score >= 60
      ? "text-yellow-400 stroke-yellow-400"
      : "text-red-400 stroke-red-400";

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-zinc-700"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color.split(" ")[0]}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-400 uppercase tracking-wider">Score</span>
    </div>
  );
}

function RisikoBadge({ risiko }: { risiko: string }) {
  const lower = risiko.toLowerCase();
  const color = lower.startsWith("hoch")
    ? "bg-red-500/10 text-red-400 border-red-500/30"
    : lower.startsWith("mittel")
    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
    : "bg-green-500/10 text-green-400 border-green-500/30";

  return (
    <div className={`flex items-start gap-2 border rounded-xl px-4 py-3 text-sm ${color}`}>
      <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold uppercase tracking-wide text-xs block mb-0.5">Verletzungsrisiko</span>
        {risiko}
      </div>
    </div>
  );
}

export default function FeedbackCard({
  score,
  overall,
  positives,
  corrections,
  verletzungsrisiko,
  cue,
  naechste_schritte,
}: FeedbackResult) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <ScoreCircle score={score} />
        <div>
          <h2 className="text-lg font-semibold mb-1">Gesamtbewertung</h2>
          <p className="text-zinc-300 text-sm leading-relaxed">{overall}</p>
        </div>
      </div>

      {/* Verletzungsrisiko */}
      {verletzungsrisiko && <RisikoBadge risiko={verletzungsrisiko} />}

      {/* Positives */}
      {positives?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Was gut war
          </h3>
          <ul className="space-y-2">
            {positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-200">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Corrections */}
      {corrections?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Verbesserungen
          </h3>
          <ul className="space-y-3">
            {corrections.map((c, i) => (
              <li key={i} className="bg-zinc-800/50 rounded-xl p-3 text-sm">
                <div className="flex items-start gap-2 text-yellow-300 font-medium mb-1">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {c.fehler}
                </div>
                <p className="text-zinc-300 pl-6">{c.korrektur}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coaching Cue */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            Dein Coaching-Cue
          </span>
        </div>
        <p className="text-zinc-100 font-medium">{cue}</p>
      </div>

      {/* Nächste Schritte */}
      {naechste_schritte?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Nächste Schritte
          </h3>
          <ul className="space-y-2">
            {naechste_schritte.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <ArrowRight className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
