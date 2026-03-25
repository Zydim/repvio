"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getUserPlan } from "@/lib/api";

const PLAN_STYLES: Record<string, { label: string; classes: string }> = {
  free: {
    label: "Free",
    classes: "bg-zinc-800 text-zinc-400 border-zinc-700",
  },
  pro: {
    label: "Pro",
    classes: "bg-blue-950 text-blue-300 border-blue-800",
  },
  elite: {
    label: "Elite",
    classes: "bg-amber-950 text-amber-300 border-amber-800",
  },
};

export default function PlanBadge() {
  const { data: session } = useSession();
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    getUserPlan(session.user.email)
      .then((data) => setPlan(data.plan))
      .catch(() => {});
  }, [session?.user?.email]);

  if (!plan) return null;

  const style = PLAN_STYLES[plan] || PLAN_STYLES.free;

  return (
    <Link
      href="/pricing"
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-opacity hover:opacity-80 ${style.classes}`}
    >
      {style.label}
    </Link>
  );
}
