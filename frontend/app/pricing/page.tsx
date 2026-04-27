"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Zap, Crown, ArrowLeft } from "lucide-react";
import { createCheckoutSession, verifyCheckoutSession, getUserPlan } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
    cta: "Kostenlos",
    icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    price: "9,99",
    period: "/ Monat",
    features: [
      "30 Video-Analysen / Monat",
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
      "100 Video-Analysen / Monat",
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
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const sessionId = searchParams.get("session_id");
  const userEmail = session?.user?.email ?? "";
  const verified = useRef(false);

  // Fetch the user's current plan when session is available
  useEffect(() => {
    if (userEmail) {
      getUserPlan(userEmail)
        .then((data) => {
          setCurrentPlan(data.plan);
          if (data.plan === "beta") router.replace("/analyze");
        })
        .catch(() => setCurrentPlan("free"));
    }
  }, [userEmail]);

  useEffect(() => {
    if (success && sessionId && !verified.current) {
      verified.current = true;
      const tryVerify = (attempts = 0) => {
        verifyCheckoutSession(sessionId)
          .then(async () => {
            await update(); // Refresh NextAuth session
            if (userEmail) {
              getUserPlan(userEmail)
                .then((data) => setCurrentPlan(data.plan))
                .catch(() => {});
            }
            router.replace("/pricing"); // Remove URL params without reload loop
          })
          .catch(() => {
            if (attempts < 3) setTimeout(() => tryVerify(attempts + 1), 2000);
          });
      };
      tryVerify();
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
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16 flex-1">
        {/* Success / Cancel Banner */}
        {success && (
          <div className="mb-8 bg-emerald-950/50 border border-emerald-800 rounded-xl px-4 md:px-6 py-4 text-center">
            <p className="text-emerald-300 font-medium text-sm md:text-base">
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
          <div className="mb-8 bg-amber-950/50 border border-amber-800 rounded-xl px-4 md:px-6 py-4 text-center">
            <p className="text-amber-300 font-medium text-sm md:text-base">
              Zahlung abgebrochen. Du kannst es jederzeit erneut versuchen.
            </p>
          </div>
        )}

        {/* Early Bird Banner */}
        <div className="mb-8 bg-gradient-to-r from-amber-950/60 to-orange-950/60 border border-amber-800/60 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-amber-300 font-semibold text-sm">Early Bird Angebot — nur für die ersten 100 User</p>
              <p className="text-amber-400/70 text-xs">Pro für 7,99€ statt 9,99€ / Monat</p>
            </div>
          </div>
          <span className="text-amber-300 text-xs font-bold whitespace-nowrap border border-amber-700 px-2 py-1 rounded-full">-20%</span>
        </div>

        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold mb-3">Wähle deinen Plan</h1>
          <p className="text-zinc-400 text-sm md:text-lg">
            Mehr Analysen, bessere Technik, schnellere Fortschritte.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 md:p-8 flex flex-col ${
                plan.popular
                  ? "border-violet-500/60 bg-zinc-900 shadow-[0_0_40px_rgba(139,92,246,0.1)]"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                  Beliebt
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <plan.icon className="w-5 h-5 text-zinc-300" />
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-bold text-white">{plan.price}€</span>
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

              {plan.id === currentPlan ? (
                <div className="py-3 rounded-xl text-center text-sm font-medium text-zinc-500 bg-zinc-800/50 border border-zinc-700">
                  Aktueller Plan
                </div>
              ) : plan.id === "free" ? (
                <div className="py-3 rounded-xl text-center text-sm font-medium text-zinc-500 bg-zinc-800/50 border border-zinc-700">
                  {plan.cta}
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]"
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
      </main>

      <Footer />
    </div>
  );
}
