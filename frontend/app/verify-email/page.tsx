"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Kein Verifizierungs-Token gefunden.");
      return;
    }

    fetch(`${API_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Deine E-Mail wurde erfolgreich bestätigt!");
        } else {
          setStatus("error");
          setMessage(data.detail || "Verifizierung fehlgeschlagen.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Ein Fehler ist aufgetreten.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <Link href="/" className="text-xl font-bold tracking-tight mb-10">
        Repvio
      </Link>

      <div className="w-full max-w-sm text-center">
        {status === "loading" && (
          <p className="text-zinc-400">E-Mail wird verifiziert...</p>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-2">Bestätigt!</h1>
            <p className="text-zinc-400 text-sm mb-8">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-xl font-semibold text-sm bg-white text-zinc-950 hover:bg-zinc-200 transition-colors text-center"
            >
              Jetzt anmelden
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-4">✗</div>
            <h1 className="text-2xl font-bold mb-2">Fehler</h1>
            <p className="text-zinc-400 text-sm mb-8">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-xl font-semibold text-sm bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 transition-colors text-center"
            >
              Zurück zum Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><p className="text-zinc-400">Laden...</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
