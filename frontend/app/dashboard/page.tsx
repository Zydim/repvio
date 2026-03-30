"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import HistoryTable from "@/components/HistoryTable";
import ProgressChart from "@/components/ProgressChart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HistorySession, getHistory } from "@/lib/api";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<HistorySession[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    setLoading(true);
    getHistory(session.user.email)
      .then(setSessions)
      .catch(() => setError("Fehler beim Laden der History."))
      .finally(() => setLoading(false));
  }, [session?.user?.email]);

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
      </main>

      <Footer />
    </div>
  );
}
