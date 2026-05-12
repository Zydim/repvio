"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle, Zap, ShieldAlert, TrendingUp, ChevronDown, ChevronUp, Share2, Copy, Check, Info } from "lucide-react";
import { FeedbackResult, NaechsterSchritt, Teilscores } from "@/lib/api";

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
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-700" />
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={color} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color.split(" ")[0]}`}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-400 uppercase tracking-wider">Score</span>
    </div>
  );
}

const TEILSCORE_LABELS: Record<keyof Teilscores, string> = {
  haltung: "Haltung & Wirbelsäule",
  gelenke: "Gelenkstellungen",
  rom: "Bewegungsumfang",
  bewegungsfluss: "Bewegungsfluss",
  gesamteindruck: "Gesamteindruck",
};

function TeilscoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 20) * 100;
  const color =
    value >= 16 ? "bg-green-500" : value >= 12 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-40 shrink-0">{label}</span>
      <div className="flex-1 bg-zinc-700 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-zinc-300 w-10 text-right">{value}/20</span>
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
        <span className="font-semibold uppercase tracking-wide text-xs block mb-0.5">Biomechanische Belastung</span>
        {risiko}
      </div>
    </div>
  );
}

const SCORE_LABELS = [
  { min: 90, label: "Elite-Technik 🏆", color: "text-green-400" },
  { min: 80, label: "Sehr gute Technik ✅", color: "text-green-500" },
  { min: 65, label: "Solide Grundtechnik 📈", color: "text-yellow-400" },
  { min: 50, label: "Mehrere Verbesserungspunkte", color: "text-orange-400" },
  { min: 0,  label: "Grundlegende Probleme", color: "text-red-400" },
];

export default function FeedbackCard({
  score,
  teilscores,
  overall,
  positives,
  corrections,
  verletzungsrisiko,
  cue,
  naechste_schritte,
}: FeedbackResult) {
  const [correctionsOpen, setCorrectionsOpen] = useState(false);
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const quickFix = corrections?.[0] ?? null;
  const remainingCorrections = corrections?.slice(1) ?? [];

  const scoreLabel = SCORE_LABELS.find((l) => score >= l.min);

  async function handleShare() {
    const text = `Mein Score: ${score}/100 — ${scoreLabel?.label ?? ""}\n\n${overall}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "Repvio Technik-Analyse", text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <ScoreCircle score={score} />
          {scoreLabel && (
            <span className={`text-xs font-medium ${scoreLabel.color} text-center`}>
              {scoreLabel.label}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="text-lg font-semibold">Gesamtbewertung</h2>
            <div className="flex items-center gap-2 shrink-0">
              {/* Score-Info */}
              <button
                onClick={() => setScoreInfoOpen(!scoreInfoOpen)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Score-Skala"
              >
                <Info className="w-4 h-4" />
              </button>
              {/* Share */}
              <button
                onClick={handleShare}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Analyse teilen"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {scoreInfoOpen && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 mb-2 text-xs space-y-1">
              {SCORE_LABELS.map((l) => (
                <div key={l.min} className="flex justify-between">
                  <span className={`font-semibold ${l.color}`}>
                    {l.min === 0 ? "< 50" : l.min === 90 ? "90–99" : `${l.min}–${l.min + 9}`}
                  </span>
                  <span className="text-zinc-400">{l.label}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-zinc-300 text-sm leading-relaxed">{overall}</p>
        </div>
      </div>

      {/* Teilscores Breakdown */}
      {teilscores && (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Bewertung im Detail</h3>
          {(Object.keys(TEILSCORE_LABELS) as (keyof Teilscores)[]).map((key) => (
            <TeilscoreBar key={key} label={TEILSCORE_LABELS[key]} value={teilscores[key]} />
          ))}
        </div>
      )}

      {/* Quick-Fix — #1 Korrektur prominent gepinnt */}
      {quickFix && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Quick-Fix #1</span>
          </div>
          <p className="text-yellow-200 font-medium text-sm mb-1">{quickFix.fehler}</p>
          <p className="text-zinc-300 text-sm">{quickFix.korrektur}</p>
        </div>
      )}

      {/* Verletzungsrisiko */}
      {verletzungsrisiko && <RisikoBadge risiko={verletzungsrisiko} />}

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

      {/* Weitere Verbesserungen — Accordion */}
      {remainingCorrections.length > 0 && (
        <div>
          <button
            onClick={() => setCorrectionsOpen(!correctionsOpen)}
            className="w-full flex items-center justify-between text-sm font-medium text-zinc-400 uppercase tracking-wider py-2 hover:text-zinc-200 transition-colors"
          >
            <span>Alle Verbesserungen ({corrections.length})</span>
            {correctionsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {correctionsOpen && (
            <ul className="space-y-3 mt-3">
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
          )}
        </div>
      )}

      {/* Nächste Schritte — Score verbessern */}
      {naechste_schritte?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              So holst du mehr Punkte
            </h3>
          </div>
          <ul className="space-y-2">
            {naechste_schritte.map((s, i) => {
              const isObj = typeof s === "object" && s !== null && "tipp" in s;
              const item = isObj ? (s as NaechsterSchritt) : null;
              return (
                <li key={i} className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3">
                  {item ? (
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-zinc-200 leading-relaxed flex-1">{item.tipp}</p>
                      <span className="shrink-0 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 whitespace-nowrap">
                        {item.score_potenzial}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-200 leading-relaxed">{s as string}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
