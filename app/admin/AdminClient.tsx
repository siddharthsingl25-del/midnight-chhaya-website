"use client";

/**
 * Admin stock dashboard.
 *
 * Password gate → table of every product with current stock, with +/-
 * buttons and an inline number input. Edits hit /api/admin/stock which
 * verifies the cookie set by /api/admin/login.
 *
 * Designed to be usable on a phone: the action column wraps and the
 * buttons are full-thumb size.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, Plus } from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { easeCinematic } from "@/lib/animations";

type Row = { slug: string; stock: number; updated_at: string };

export default function AdminClient() {
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  // —— authed: load stock ————————————————————————————
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/stock", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Failed to load stock");
      setLoading(false);
      return;
    }
    const { rows } = (await res.json()) as { rows: Row[] };
    setRows(rows);
    setAuthed(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // —— stock by slug map ————————————————————————————
  const byslug = useMemo(() => {
    const m: Record<string, Row> = {};
    for (const r of rows) m[r.slug] = r;
    return m;
  }, [rows]);

  const filteredProducts = useMemo(() => {
    if (!filter.trim()) return PRODUCTS;
    const q = filter.trim().toLowerCase();
    return PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.includes(q)
    );
  }, [filter]);

  // —— mutations ————————————————————————————
  const bumpStock = async (slug: string, delta: number) => {
    setError("");
    const res = await fetch("/api/admin/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, delta }),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error || "Update failed");
      return;
    }
    const { row } = (await res.json()) as { row: Row };
    setRows((prev) => prev.map((r) => (r.slug === row.slug ? row : r)));
  };

  const setStockAbsolute = async (slug: string, stock: number) => {
    setError("");
    const res = await fetch("/api/admin/stock", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, stock }),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error || "Update failed");
      return;
    }
    const { row } = (await res.json()) as { row: Row };
    setRows((prev) => prev.map((r) => (r.slug === row.slug ? row : r)));
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setRows([]);
  };

  // —— render ————————————————————————————
  if (loading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-6">
        <p className="eyebrow text-bone-dim">Loading…</p>
      </section>
    );
  }

  if (!authed) {
    return <LoginGate onSuccess={load} />;
  }

  const totalUnits = rows.reduce((s, r) => s + r.stock, 0);
  const outCount = rows.filter((r) => r.stock === 0).length;
  const lowCount = rows.filter((r) => r.stock > 0 && r.stock <= 3).length;

  return (
    <section className="pt-32 pb-32 px-6 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="eyebrow text-bone-dim">Admin</span>
            <h1 className="font-display uppercase text-bone text-3xl md:text-5xl mt-2">
              Stock
            </h1>
            <p className="font-serif italic text-bone-dim mt-3 text-sm">
              {totalUnits} units in stock · {outCount} sold out · {lowCount} low
            </p>
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

        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or slug…"
          className="w-full sm:w-80 mb-8 bg-transparent border-b border-bone/20 px-1 py-3
                     font-body text-bone placeholder:text-bone-dim/50
                     focus:outline-none focus:border-gold transition-colors"
        />

        {error ? (
          <div className="mb-6 border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <ul className="flex flex-col">
          {filteredProducts.map((p) => {
            const row = byslug[p.slug];
            const stock = row?.stock ?? 0;
            const lowOrOut =
              stock === 0
                ? "border-oxblood/60"
                : stock <= 3
                  ? "border-gold/60"
                  : "border-bone/10";
            return (
              <li
                key={p.slug}
                className={`flex items-center gap-4 py-4 border-b ${lowOrOut}`}
              >
                <div className="relative w-14 h-16 flex-shrink-0 overflow-hidden bg-charcoal">
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-bone text-sm sm:text-base truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-bone-dim uppercase tracking-[0.15em] truncate">
                    {p.category} · {p.slug}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => bumpStock(p.slug, -1)}
                    aria-label="Decrease stock"
                    className="grid place-items-center w-9 h-9 border border-bone/20
                               text-bone hover:border-oxblood hover:text-oxblood
                               transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={stock <= 0}
                  >
                    <Minus size={14} strokeWidth={1.75} />
                  </button>
                  <StockInput
                    value={stock}
                    onCommit={(n) => setStockAbsolute(p.slug, n)}
                  />
                  <button
                    type="button"
                    onClick={() => bumpStock(p.slug, +1)}
                    aria-label="Increase stock"
                    className="grid place-items-center w-9 h-9 border border-bone/20
                               text-bone hover:border-gold hover:text-gold
                               transition-colors"
                  >
                    <Plus size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* —— Editable stock cell ———————————————————————————— */

function StockInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (n: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setLocal(String(value));
  }, [value, dirty]);

  const commit = () => {
    const n = Math.max(0, parseInt(local, 10) || 0);
    setDirty(false);
    if (n !== value) onCommit(n);
    setLocal(String(n));
  };

  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      value={local}
      onChange={(e) => {
        setDirty(true);
        setLocal(e.target.value);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      aria-label="Stock"
      className="w-14 h-9 text-center bg-transparent border border-bone/20
                 font-body text-bone text-base
                 focus:outline-none focus:border-gold transition-colors"
    />
  );
}

/* —— Login gate ———————————————————————————— */

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
