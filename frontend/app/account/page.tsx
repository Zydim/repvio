"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUserPlan, cancelSubscription, deleteAccount } from "@/lib/api";

const PLAN_INFO: Record<string, { label: string; color: string; limit: string }> = {
  free: { label: "Free", color: "text-zinc-400 bg-zinc-800 border-zinc-700", limit: "3 Analysen / Monat" },
  beta: { label: "Beta", color: "text-purple-300 bg-purple-950 border-purple-800", limit: "10 Analysen / Monat" },
  pro: { label: "Pro", color: "text-blue-300 bg-blue-950 border-blue-800", limit: "30 Analysen / Monat" },
  elite: { label: "Elite", color: "text-amber-300 bg-amber-950 border-amber-800", limit: "Unbegrenzte Analysen" },
};

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<number>(0);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user?.email) return;
    getUserPlan(session.user.email).then((data) => {
      setPlan(data.plan);
      setAnalyses(data.analyses_this_month);
    }).catch(() => {});
  }, [session?.user?.email]);

  if (status === "loading" || !plan) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  const info = PLAN_INFO[plan] || PLAN_INFO.free;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-10 flex-1 w-full">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Mein Account</h1>

        {/* Profile */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Profil</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400 mb-1">E-Mail</p>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Aktueller Plan</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${info.color}`}>
                {info.label}
              </span>
              <p className="text-sm text-zinc-400 mt-2">{info.limit}</p>
              <p className="text-xs text-zinc-500 mt-1">
                Diesen Monat genutzt: <span className="text-white">{analyses}</span>
              </p>
            </div>
            {plan === "free" && (
              <Link
                href="/pricing"
                className="text-sm bg-white text-zinc-950 px-4 py-2 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
              >
                Upgraden
              </Link>
            )}
          </div>
          {plan !== "free" && (
            <p className="text-xs text-zinc-500">
              Um dein Abo zu kündigen, kontaktiere uns:{" "}
              <a href="mailto:support@repvio.app" className="text-zinc-300 underline">
                support@repvio.app
              </a>
            </p>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-3 mb-4">
            <p className="text-emerald-300 text-sm">{message}</p>
          </div>
        )}

        {/* Abo kündigen */}
        {plan !== "free" && plan !== "beta" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
            <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Abonnement</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Dein Abo läuft bis zum Ende des Abrechnungszeitraums weiter und wird dann nicht verlängert.
            </p>
            <button
              onClick={async () => {
                if (!confirm("Abo wirklich kündigen?")) return;
                setCancelLoading(true);
                try {
                  await cancelSubscription(session?.user?.email ?? "");
                  setMessage("Abo wird zum Ende des Abrechnungszeitraums gekündigt.");
                } catch {
                  setMessage("Fehler beim Kündigen. Bitte kontaktiere support@repvio.app");
                } finally {
                  setCancelLoading(false);
                }
              }}
              disabled={cancelLoading}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40"
            >
              {cancelLoading ? "Wird gekündigt..." : "Abo kündigen"}
            </button>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-zinc-900 border border-red-900/30 rounded-2xl p-6">
          <h2 className="text-xs text-red-500 uppercase tracking-wider mb-4">Gefahrenzone</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white mb-1">Konto löschen</p>
              <p className="text-xs text-zinc-500">
                {plan === "beta"
                  ? "Beta-Accounts können nicht selbst gelöscht werden. Wende dich an support@repvio.app"
                  : "Alle Daten und Analysen werden dauerhaft gelöscht."}
              </p>
            </div>
            {plan !== "beta" && (
              <button
                onClick={async () => {
                  const pw = prompt("Passwort zur Bestätigung eingeben:");
                  if (!pw) return;
                  if (!confirm("Konto wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden!")) return;
                  setDeleteLoading(true);
                  try {
                    await deleteAccount(session?.user?.email ?? "", pw);
                    signOut({ callbackUrl: "/" });
                  } catch {
                    setMessage("Fehler beim Löschen. Falsches Passwort oder Serverfehler.");
                    setDeleteLoading(false);
                  }
                }}
                disabled={deleteLoading}
                className="text-sm text-red-400 hover:text-red-300 transition-colors border border-red-900/50 px-4 py-2 rounded-lg disabled:opacity-40 whitespace-nowrap"
              >
                {deleteLoading ? "Wird gelöscht..." : "Konto löschen"}
              </button>
            )}
          </div>
          <div className="border-t border-zinc-800 mt-4 pt-4">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
