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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 md:px-6">
      <Link href="/" className="text-xl font-bold tracking-tight mb-10">
        Repvio
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Passwort vergessen</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Gib deine E-Mail ein und wir senden dir einen Reset-Link.
        </p>

        {sent ? (
          <div className="bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 py-4 text-center">
            <p className="text-emerald-300 text-sm font-medium mb-2">
              Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.
            </p>
            <p className="text-zinc-500 text-xs">
              Prüfe deinen Posteingang (und Spam-Ordner).
            </p>
            <Link href="/login" className="text-sm text-white underline mt-4 inline-block">
              Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                placeholder="deine@email.de"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-white text-zinc-950 hover:bg-zinc-200 transition-colors disabled:opacity-40"
            >
              {loading ? "Senden..." : "Reset-Link senden"}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-300">
                Zurück zum Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
