"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
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
        <h1 className="text-2xl font-bold mb-2">Passwort vergessen</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Gib deine E-Mail ein und wir senden dir einen Reset-Link.
        </p>

        {sent ? (
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-4 text-center">
            <p className="text-emerald-300 text-sm font-medium mb-2">
              Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.
            </p>
            <p className="text-zinc-500 text-xs mb-4">Prüfe deinen Posteingang (und Spam-Ordner).</p>
            <Link href="/login" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="deine@email.de"
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
              {loading ? "Senden..." : "Reset-Link senden"}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                Zurück zum Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
