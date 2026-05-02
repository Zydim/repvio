"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { HistorySession, SessionDetail, getSession, api } from "@/lib/api";
import FeedbackCard from "@/components/FeedbackCard";

interface HistoryTableProps {
  sessions: HistorySession[];
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-900/60 text-green-400 border-green-800"
      : score >= 60
      ? "bg-yellow-900/60 text-yellow-400 border-yellow-800"
      : "bg-red-900/60 text-red-400 border-red-800";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {score}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryTable({ sessions }: HistoryTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, SessionDetail>>({});
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [ratedIds, setRatedIds] = useState<Set<number>>(new Set());

  async function submitRating(sessionId: number, exerciseType: string, score: number, rating: string) {
    setRatedIds((prev) => new Set(prev).add(sessionId));
    try {
      await api.post("/analyze/feedback", {
        session_id: sessionId,
        exercise_type: exerciseType,
        score,
        helpful: rating === "passt",
        score_rating: rating,
      });
    } catch { /* silent fail */ }
  }

  async function toggleRow(sessionId: number) {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    if (!details[sessionId]) {
      setLoadingId(sessionId);
      try {
        const detail = await getSession(sessionId);
        setDetails((prev) => ({ ...prev, [sessionId]: detail }));
      } catch {
        // ignore
      } finally {
        setLoadingId(null);
      }
    }
  }

  if (sessions.length === 0) {
    return (
      <p className="text-center text-zinc-500 py-12">
        Noch keine Trainings-Sessions gefunden.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3">Datum</th>
            <th className="text-left px-4 py-3">Übung</th>
            <th className="text-left px-4 py-3">Score</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Kurzfeedback</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <Fragment key={s.session_id}>
              <tr
                onClick={() => toggleRow(s.session_id)}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/40 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                  {formatDate(s.created_at)}
                </td>
                <td className="px-4 py-3 text-zinc-200 font-medium">{s.exercise_type}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={s.score} />
                </td>
                <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell max-w-xs truncate">
                  {s.overall}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {expandedId === s.session_id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </td>
              </tr>
              {expandedId === s.session_id && (
                <tr key={`${s.session_id}-detail`}>
                  <td colSpan={5} className="px-4 py-4 bg-zinc-900">
                    {loadingId === s.session_id ? (
                      <p className="text-zinc-500 text-sm py-4 text-center">Lade Details...</p>
                    ) : details[s.session_id] ? (
                      <>
                        {/* Score Rating Widget */}
                        <div className="mb-4 bg-zinc-800/60 border border-zinc-700 rounded-2xl px-5 py-3">
                          {ratedIds.has(s.session_id) ? (
                            <p className="text-sm text-emerald-400 text-center py-0.5">✓ Danke für dein Feedback!</p>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <p className="text-xs text-zinc-400 shrink-0">War der Score fair?</p>
                              <div className="flex gap-2 flex-wrap">
                                {(["zu_streng", "passt", "zu_grosszuegig"] as const).map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={(e) => { e.stopPropagation(); submitRating(s.session_id, s.exercise_type, s.score, rating); }}
                                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-violet-500/20 hover:border-violet-500/50 border border-zinc-700 text-xs text-zinc-300 transition-all"
                                  >
                                    {rating === "zu_streng" ? "😤 Zu streng" : rating === "passt" ? "✅ Passt" : "😅 Zu großzügig"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <FeedbackCard {...details[s.session_id].feedback} />
                      </>
                    ) : null}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
