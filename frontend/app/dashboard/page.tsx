"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import HistoryTable from "@/components/HistoryTable";
import ProgressChart from "@/components/ProgressChart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HistorySession, getHistory } from "@/lib/api";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<HistorySession[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Beta Feedback
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    setLoading(true);
    getHistory(session.user.email)
      .then(setSessions)
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? err?.message ?? "Unbekannter Fehler";
        setError(`Fehler beim Laden der History: ${msg}`);
      })
      .finally(() => setLoading(false));
  }, [session?.user?.email]);

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    setFeedbackError(null);
    try {
      await api.post("/auth/beta-feedback", {
        message: feedbackText.trim(),
      });
      setFeedbackSuccess(true);
      setFeedbackText("");
    } catch {
      setFeedbackError("Fehler beim Senden. Bitte erneut versuchen.");
    } finally {
      setFeedbackSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 flex-1 w-full">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400 mb-8 md:mb-10 text-sm">
          {session?.user?.email ?? ""}
        </p>

        {loading && (
          <p className="text-zinc-500 text-sm py-12 text-center">Lade Sessions...</p>
        )}
        {error && (
          <p className="text-sm text-red-400 mb-6">{error}</p>
        )}
        {sessions !== null && !loading && (
          <>
            <ProgressChart sessions={sessions} />
            <HistoryTable sessions={sessions} />
          </>
        )}

        {/* Beta Feedback */}
        <div className="mt-12 bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Beta-Feedback</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Was gefällt dir? Was fehlt? Feedback ist anonym — sei ehrlich.
          </p>
          {feedbackSuccess ? (
            <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3">
              <p className="text-emerald-300 text-sm">✓ Danke für dein Feedback!</p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="z.B. Die Analyse bei Klimmzügen war super genau. Ich würde mir noch wünschen..."
                rows={4}
                maxLength={2000}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">{feedbackText.length}/2000</span>
                <button
                  type="submit"
                  disabled={!feedbackText.trim() || feedbackSending}
                  className="px-5 py-2 text-white text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all shadow-[0_0_16px_rgba(139,92,246,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {feedbackSending ? "Wird gesendet..." : "Feedback senden"}
                </button>
              </div>
              {feedbackError && (
                <p className="text-xs text-red-400">{feedbackError}</p>
              )}
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
