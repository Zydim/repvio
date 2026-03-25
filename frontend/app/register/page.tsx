"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Registrierung fehlgeschlagen.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Registrierung erfolgreich, aber Login fehlgeschlagen.");
    } else {
      router.push("/analyze");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <Link href="/" className="text-xl font-bold tracking-tight mb-10">
        Repvio
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Konto erstellen</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Bereits registriert?{" "}
          <Link href="/login" className="text-white underline underline-offset-4">
            Anmelden
          </Link>
        </p>

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
          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder="Mindestens 6 Zeichen"
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
            className="w-full py-3 rounded-xl font-semibold text-sm bg-white text-zinc-950 hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Konto wird erstellt..." : "Kostenlos registrieren"}
          </button>
        </form>
      </div>
    </div>
  );
}
