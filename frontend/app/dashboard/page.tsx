"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import HistoryTable from "@/components/HistoryTable";
import PlanBadge from "@/components/PlanBadge";
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
          <Link
            href="/analyze"
            className="text-sm bg-white text-zinc-950 px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Analysieren
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-zinc-400 mb-10 flex items-center gap-2">
          {session?.user?.email ?? ""}
        </p>

        {loading && (
          <p className="text-zinc-500 text-sm py-12 text-center">Lade Sessions...</p>
        )}
        {error && (
          <p className="text-sm text-red-400 mb-6">{error}</p>
        )}
        {sessions !== null && !loading && (
          <HistoryTable sessions={sessions} />
        )}
      </div>
    </div>
  );
}
