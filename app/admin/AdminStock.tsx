"use client";

/**
 * Stock tab — table of every product with current stock, with +/-
 * buttons and an inline number input.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useProducts } from "@/lib/catalog-context";

type Row = { slug: string; stock: number; updated_at: string };

export default function AdminStock() {
  const products = useProducts();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await fetch("/api/admin/stock", { cache: "no-store" });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error || "Failed to load stock");
      return;
    }
    const { rows } = (await res.json()) as { rows: Row[] };
    setRows(rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byslug = useMemo(() => {
    const m: Record<string, Row> = {};
    for (const r of rows) m[r.slug] = r;
    return m;
  }, [rows]);

  const filteredProducts = useMemo(() => {
    if (!filter.trim()) return products;
    const q = filter.trim().toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.includes(q)
    );
  }, [filter, products]);

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
    setRows((prev) =>
      prev.find((r) => r.slug === row.slug)
        ? prev.map((r) => (r.slug === row.slug ? row : r))
        : [...prev, row]
    );
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
    setRows((prev) =>
      prev.find((r) => r.slug === row.slug)
        ? prev.map((r) => (r.slug === row.slug ? row : r))
        : [...prev, row]
    );
  };

  const totalUnits = rows.reduce((s, r) => s + r.stock, 0);
  const outCount = rows.filter((r) => r.stock === 0).length;
  const lowCount = rows.filter((r) => r.stock > 0 && r.stock <= 3).length;

  return (
    <>
      <p className="font-serif italic text-bone-dim text-sm mb-6">
        {totalUnits} units in stock · {outCount} sold out · {lowCount} low
      </p>

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
          const borderClass =
            stock === 0
              ? "border-oxblood/60"
              : stock <= 3
                ? "border-gold/60"
                : "border-bone/10";
          return (
            <li
              key={p.slug}
              className={`flex items-center gap-4 py-4 border-b ${borderClass}`}
            >
              <div className="relative w-14 h-16 flex-shrink-0 overflow-hidden bg-charcoal">
                {p.images[0] ? (
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : null}
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
    </>
  );
}

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
