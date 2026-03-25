"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Zap, Crown, ArrowLeft } from "lucide-react";
import { createCheckoutSession, verifyCheckoutSession } from "@/lib/api";
import PlanBadge from "@/components/PlanBadge";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0",
    period: "für immer",
    features: [
      "3 Video-Analysen / Monat",
      "KI-Technik-Feedback",
      "Trainingshistorie",
    ],
    cta: "Aktueller Plan",
    icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    price: "9,99",
    period: "/ Monat",
    features: [
      "50 Video-Analysen / Monat",
      "KI-Technik-Feedback",
      "Trainingshistorie",
      "Prioritäts-Analyse",
    ],
    cta: "Pro wählen",
    icon: Zap,
    popular: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "19,99",
    period: "/ Monat",
    features: [
      "Unbegrenzte Video-Analysen",
      "KI-Technik-Feedback",
      "Trainingshistorie",
      "Prioritäts-Analyse",
      "Früher Zugang zu neuen Features",
    ],
    cta: "Elite wählen",
    icon: Crown,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const sessionId = searchParams.get("session_id");
  const userEmail = session?.user?.email ?? "";
  const verified = useRef(false);

  useEffect(() => {
    if (success && sessionId && !verified.current) {
      verified.current = true;
      verifyCheckoutSession(sessionId).catch(() => {});
    }
  }, [success, sessionId]);

  async function handleCheckout(plan: string) {
    if (!userEmail) {
      window.location.href = "/login";
      return;
    }
    setLoading(plan);
    try {
      const { url } = await createCheckoutSession(userEmail, plan);
      if (url) window.location.href = url;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Fehler beim Erstellen der Checkout-Session.";
      alert(message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Repvio
        </Link>
        <div className="flex items-center gap-4">
          <PlanBadge />
          <Link
            href="/analyze"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Analysieren
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Success / Cancel Banner */}
        {success && (
          <div className="mb-8 bg-emerald-950/50 border border-emerald-800 rounded-xl px-6 py-4 text-center">
            <p className="text-emerald-300 font-medium">
              Zahlung erfolgreich! Dein Plan wurde aktualisiert.
            </p>
            <Link
              href="/analyze"
              className="text-sm text-emerald-400 underline mt-1 inline-block"
            >
              Jetzt analysieren
            </Link>
          </div>
        )}
        {canceled && (
          <div className="mb-8 bg-amber-950/50 border border-amber-800 rounded-xl px-6 py-4 text-center">
            <p className="text-amber-300 font-medium">
              Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.
            </p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Wähle deinen Plan</h1>
          <p className="text-zinc-400 text-lg">
            Mehr Analysen, bessere Technik, schnellere Fortschritte.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.popular
                  ? "border-white bg-zinc-900"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-zinc-950 text-xs font-bold px-4 py-1 rounded-full">
                  Beliebt
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <plan.icon className="w-5 h-5 text-zinc-300" />
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-zinc-400 text-sm">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.id === "free" ? (
                <div className="py-3 rounded-xl text-center text-sm font-medium text-zinc-500 bg-zinc-800/50 border border-zinc-700">
                  {plan.cta}
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                    plan.popular
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700"
                  }`}
                >
                  {loading === plan.id ? "Weiterleitung..." : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/analyze"
            className="text-sm text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Zurück zur Analyse
          </Link>
        </div>
      </div>
    </div>
  );
}
