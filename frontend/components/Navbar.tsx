"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import PlanBadge from "@/components/PlanBadge";

export default function Navbar() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-800">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Repvio
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn && <PlanBadge />}
          <Link href="/pricing" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Pricing
          </Link>
          {isLoggedIn && (
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Dashboard
            </Link>
          )}
          {isLoggedIn && (
            <Link href="/account" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Account
            </Link>
          )}
          <Link
            href="/analyze"
            className="text-sm bg-white text-zinc-950 px-4 py-1.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Analysieren
          </Link>
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Abmelden
            </button>
          ) : (
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Anmelden
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-zinc-400 hover:text-zinc-100"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-zinc-800 px-4 py-4 space-y-3 bg-zinc-950">
          {isLoggedIn && (
            <div className="pb-2">
              <PlanBadge />
            </div>
          )}
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="block text-sm text-zinc-400 hover:text-zinc-100 py-2"
          >
            Pricing
          </Link>
          {isLoggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block text-sm text-zinc-400 hover:text-zinc-100 py-2"
            >
              Dashboard
            </Link>
          )}
          {isLoggedIn && (
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block text-sm text-zinc-400 hover:text-zinc-100 py-2"
            >
              Account
            </Link>
          )}
          <Link
            href="/analyze"
            onClick={() => setOpen(false)}
            className="block text-sm text-zinc-400 hover:text-zinc-100 py-2"
          >
            Analysieren
          </Link>
          {isLoggedIn ? (
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="block text-sm text-zinc-500 hover:text-zinc-300 py-2"
            >
              Abmelden
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block text-sm text-zinc-400 hover:text-zinc-100 py-2"
            >
              Anmelden
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
