"use client";

/**
 * Feedback tab — shows every customer rating + comment, newest first.
 * Read-only for now.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

type Row = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  razorpay_payment_id: string;
  orders?: { order_number?: string; customer_name?: string } | null;
};

export default function AdminFeedback() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/feedback", { cache: "no-store" });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || "Failed to load feedback");
        return;
      }
      const { rows } = (await res.json()) as { rows: Row[] };
      setRows(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
    return {
      count: rows.length,
      avg: avg.toFixed(1),
    };
  }, [rows]);

  return (
    <>
      <p className="font-serif italic text-bone-dim text-sm mb-6">
        {loading
          ? "Loading…"
          : stats
            ? `${stats.count} reviews · avg ${stats.avg} / 5`
            : "No feedback yet — customers get a request 3 days after their order ships."}
      </p>

      {error ? (
        <div className="mb-6 border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <ul className="flex flex-col gap-4">
        {rows.map((r) => (
          <li key={r.id} className="border border-bone/10 p-5">
            <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    strokeWidth={1.5}
                    className={n <= r.rating ? "text-gold fill-gold" : "text-bone-dim/40"}
                  />
                ))}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-bone-dim">
                {r.orders?.order_number ?? r.razorpay_payment_id.slice(0, 14)}
                {r.orders?.customer_name ? ` · ${r.orders.customer_name}` : ""}
                {" · "}
                {new Date(r.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            {r.comment ? (
              <p className="font-serif text-bone text-base leading-relaxed">{r.comment}</p>
            ) : (
              <p className="font-serif italic text-bone-dim/60 text-sm">No comment</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
