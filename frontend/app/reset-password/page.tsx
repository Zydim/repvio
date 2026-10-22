"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080f]" />}>
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
    <div className="min-h-screen bg-[#08080f] flex flex-col items-center justify-center px-4 md:px-6">
      <Link href="/" className="text-xl font-extrabold tracking-tight mb-10 text-white">
        Repvio
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Neues Passwort</h1>
        <p className="text-zinc-500 text-sm mb-8">Gib dein neues Passwort ein.</p>

        {success ? (
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-4 text-center">
            <p className="text-emerald-300 text-sm font-medium mb-3">Passwort wurde erfolgreich zurückgesetzt!</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0066ff] hover:bg-[#0052cc] transition-colors"
            >
              Jetzt anmelden
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">Neues Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#0066ff] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">Passwort bestätigen</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#0066ff] transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#0066ff] hover:bg-[#0052cc] transition-colors disabled:opacity-40"
            >
              {loading ? "Speichern..." : "Passwort speichern"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
