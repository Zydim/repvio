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
    <div className="min-h-screen bg-[#08080f] flex flex-col items-center justify-center px-4 md:px-6">
      <Link href="/" className="text-xl font-extrabold tracking-tight mb-10 text-white">
        Repvio
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Passwort vergessen</h1>
        <p className="text-zinc-500 text-sm mb-8">
          Gib deine E-Mail ein und wir senden dir einen Reset-Link.
        </p>

        {sent ? (
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-4 text-center">
            <p className="text-emerald-300 text-sm font-medium mb-2">
              Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.
            </p>
            <p className="text-zinc-500 text-xs mb-4">Prüfe deinen Posteingang (und Spam-Ordner).</p>
            <Link href="/login" className="text-sm text-[#4d94ff] hover:text-white transition-colors">
              Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#0066ff] transition-colors"
                placeholder="deine@email.de"
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
