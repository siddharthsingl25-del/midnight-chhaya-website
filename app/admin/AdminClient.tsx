"use client";

/**
 * Admin shell — handles the password gate, top bar, and tab switcher.
 *
 * Tabs:
 *   Stock     — set quantities, see low/sold-out
 *   Products  — add / edit / delete products (image upload from phone)
 *   Chains    — add / edit / delete chain styles
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import AdminStock from "./AdminStock";
import AdminProducts from "./AdminProducts";
import AdminChains from "./AdminChains";
import { easeCinematic } from "@/lib/animations";

type Tab = "stock" | "products" | "chains";

export default function AdminClient() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("stock");

  // Probe an admin endpoint to check auth state on mount
  const probe = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stock", { cache: "no-store" });
    setAuthed(res.ok);
    setLoading(false);
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  };

  if (loading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-6">
        <p className="eyebrow text-bone-dim">Loading…</p>
      </section>
    );
  }

  if (!authed) return <LoginGate onSuccess={probe} />;

  return (
    <section className="pt-32 pb-32 px-6 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="eyebrow text-bone-dim">Admin</span>
            <h1 className="font-display uppercase text-bone text-3xl md:text-5xl mt-2">
              {tab === "stock" ? "Stock" : tab === "products" ? "Products" : "Chains"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="eyebrow text-bone-dim hover:text-bone transition-colors"
            >
              ← Site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="eyebrow text-bone-dim hover:text-oxblood transition-colors"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Tab bar */}
        <div className="flex gap-6 mb-10 border-b border-bone/10 pb-2 overflow-x-auto">
          {(["stock", "products", "chains"] as const).map((t) => {
            const selected = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={[
                  "relative eyebrow pb-2 transition-colors duration-300",
                  selected ? "text-gold" : "text-bone-dim hover:text-bone",
                ].join(" ")}
              >
                {t === "stock" ? "Stock" : t === "products" ? "Products" : "Chains"}
                {selected ? (
                  <motion.span
                    layoutId="admin-tab-underline"
                    className="absolute -bottom-[9px] left-0 right-0 h-px bg-gold"
                    transition={{ duration: 0.45, ease: easeCinematic }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: easeCinematic }}
          >
            {tab === "stock" ? <AdminStock /> : null}
            {tab === "products" ? <AdminProducts /> : null}
            {tab === "chains" ? <AdminChains /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setErr("Wrong password.");
      return;
    }
    onSuccess();
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeCinematic }}
        onSubmit={submit}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        <div>
          <span className="eyebrow text-bone-dim">Admin</span>
          <h1 className="font-display uppercase text-bone text-3xl mt-2">
            Sign in
          </h1>
        </div>

        <label className="block">
          <span className="block mb-2 font-body text-bone text-sm font-semibold tracking-wide">
            Password
          </span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                       font-body text-bone text-lg
                       focus:outline-none focus:border-gold transition-colors"
          />
        </label>

        <AnimatePresence>
          {err ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-oxblood"
            >
              {err}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-8 py-4
                     bg-gold text-ink eyebrow text-ink
                     transition-all duration-500
                     hover:shadow-[0_0_36px_-6px_rgba(184,147,90,0.6)]
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Checking…" : "Sign in"}
          {!submitting ? <Check size={14} strokeWidth={1.75} /> : null}
        </button>
      </motion.form>
    </section>
  );
}
