"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    if (password.length < 6) { setError("Passwort muss mindestens 6 Zeichen haben."); return; }
    if (!token) { setError("Ungültiger Reset-Link."); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch {
      setError("Token ungültig oder abgelaufen. Bitte erneut anfordern.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 md:px-6 relative overflow-hidden">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-[120px]" />
      </div>

      <Link href="/" className="relative text-xl font-extrabold tracking-tight mb-10 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
        Repvio
      </Link>

      <div className="relative w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Neues Passwort</h1>
        <p className="text-zinc-400 text-sm mb-8">Gib dein neues Passwort ein.</p>

        {success ? (
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-4 text-center">
            <p className="text-emerald-300 text-sm font-medium mb-3">Passwort wurde erfolgreich zurückgesetzt!</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all"
            >
              Jetzt anmelden
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">Neues Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">Passwort bestätigen</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-40"
            >
              {loading ? "Speichern..." : "Passwort speichern"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
