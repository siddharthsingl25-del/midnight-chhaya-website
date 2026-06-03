"use client";

/**
 * Finance tab — strict P&L tracking.
 *
 * Three sections:
 *   1. This-month dashboard — revenue, COGS, expenses, net profit
 *   2. Add a cash order      — friends/in-person sales land in the
 *                              same orders table as online sales
 *   3. Add an expense        — ad spend, collab, restock, etc.
 *   4. Order log + expense log — every transaction with per-row P&L
 *
 * All numbers come from /api/admin/finance which computes per-order
 * profit against the live product cost_price, payment method (cash
 * skips Razorpay fee), and shipping pass-through.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useProducts } from "@/lib/catalog-context";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
  type Product,
} from "@/lib/types";

type FinanceOrder = {
  id: number;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerInstagram: string;
  paymentMethod: "online" | "cash";
  items: Array<{ slug: string; name: string; qty: number; chainName?: string | null }>;
  subtotal: number;
  shipping: number;
  total: number;
  merchantCost: number;
  gatewayFee: number;
  cogs: number;
  netRevenue: number;
  profit: number;
  hasMissingCost: boolean;
  status: string;
};

type FinanceExpense = {
  id: number;
  category: ExpenseCategory;
  amount: number;
  description: string;
  occurredAt: string;
  createdAt: string;
};

type FinanceData = {
  orders: FinanceOrder[];
  expenses: FinanceExpense[];
  month: {
    revenue: number;
    cogs: number;
    gatewayFees: number;
    merchantCost: number;
    grossProfit: number;
    expensesTotal: number;
    expensesByCategory: Record<ExpenseCategory, number>;
    netProfit: number;
    orderCount: number;
  };
  allTime: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    expensesTotal: number;
    netProfit: number;
    orderCount: number;
  };
};

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function AdminFinance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [view, setView] = useState<"dashboard" | "cash" | "expense">("dashboard");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/admin/finance", { cache: "no-store" });
    if (!res.ok) {
      setErr((await res.json().catch(() => ({ error: "Load failed" }))).error ?? "Load failed");
      setLoading(false);
      return;
    }
    const d = (await res.json()) as FinanceData;
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <p className="eyebrow text-bone-dim">Loading…</p>;
  }
  if (err) {
    return <p className="text-oxblood">{err}</p>;
  }
  if (!data) return null;

  if (view === "cash") {
    return (
      <CashOrderForm
        onDone={async () => {
          await load();
          setView("dashboard");
        }}
        onCancel={() => setView("dashboard")}
      />
    );
  }

  if (view === "expense") {
    return (
      <ExpenseForm
        onDone={async () => {
          await load();
          setView("dashboard");
        }}
        onCancel={() => setView("dashboard")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setView("cash")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-ink"
        >
          <Plus size={14} strokeWidth={1.75} />
          <span className="eyebrow text-[10px] text-ink">Cash order</span>
        </button>
        <button
          type="button"
          onClick={() => setView("expense")}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-bone/30 text-bone"
        >
          <Plus size={14} strokeWidth={1.75} />
          <span className="eyebrow text-[10px]">Expense</span>
        </button>
      </div>

      {/* This month dashboard */}
      <section>
        <h2 className="eyebrow text-gold mb-4">This month</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Revenue" value={fmt(data.month.revenue)} sub={`${data.month.orderCount} orders`} />
          <Stat label="COGS" value={fmt(data.month.cogs)} sub="cost of goods" />
          <Stat label="Expenses" value={fmt(data.month.expensesTotal)} sub="ads + collabs + restock" />
          <Stat
            label="Net profit"
            value={fmt(data.month.netProfit)}
            sub={data.month.netProfit >= 0 ? "in the black" : "in the red"}
            highlight={data.month.netProfit >= 0 ? "good" : "bad"}
          />
        </div>
        <p className="font-serif italic text-bone-dim text-[11px] mt-3">
          Net profit = total revenue (incl shipping the customer paid) − COGS − gateway fees − per-order courier cost − all expenses (ads, collab, restock, packaging, bulk shipping, other).
        </p>

        {/* Expense breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-6">
          {EXPENSE_CATEGORIES.map((cat) => (
            <div key={cat} className="border border-bone/10 px-3 py-2">
              <p className="text-[9px] text-bone-dim uppercase tracking-[0.15em]">
                {EXPENSE_CATEGORY_LABEL[cat]}
              </p>
              <p className="font-display text-bone text-base mt-1">
                {fmt(data.month.expensesByCategory[cat])}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* All-time numbers */}
      <section>
        <h2 className="eyebrow text-gold mb-4">All time</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Revenue" value={fmt(data.allTime.revenue)} sub={`${data.allTime.orderCount} orders`} />
          <Stat label="COGS" value={fmt(data.allTime.cogs)} />
          <Stat label="Expenses" value={fmt(data.allTime.expensesTotal)} />
          <Stat
            label="Net profit"
            value={fmt(data.allTime.netProfit)}
            highlight={data.allTime.netProfit >= 0 ? "good" : "bad"}
          />
        </div>
      </section>

      {/* Orders log */}
      <section>
        <h2 className="eyebrow text-gold mb-4">Orders ({data.orders.length})</h2>
        <OrdersTable orders={data.orders} onChange={load} />
      </section>

      {/* Expenses log */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="eyebrow text-gold">Expenses ({data.expenses.length})</h2>
        </div>
        <ExpensesTable expenses={data.expenses} onChange={load} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "good" | "bad";
}) {
  const color =
    highlight === "good"
      ? "text-emerald-400"
      : highlight === "bad"
        ? "text-oxblood"
        : "text-bone";
  return (
    <div className="border border-bone/10 px-4 py-4">
      <p className="text-[10px] text-bone-dim uppercase tracking-[0.15em]">{label}</p>
      <p className={`font-display text-2xl mt-1 ${color}`}>{value}</p>
      {sub ? <p className="text-[10px] text-bone-dim mt-1">{sub}</p> : null}
    </div>
  );
}

function OrdersTable({
  orders,
  onChange,
}: {
  orders: FinanceOrder[];
  onChange: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  if (orders.length === 0) {
    return <p className="font-serif italic text-bone-dim text-sm">No orders yet.</p>;
  }
  const remove = async (orderNumber: string) => {
    if (
      !confirm(
        `Delete ${orderNumber}? Stock will be restored.\n\nThis does NOT refund the customer — use Razorpay dashboard for that.`
      )
    )
      return;
    setDeleting(orderNumber);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        alert(d.error || "Delete failed");
        return;
      }
      await onChange();
    } finally {
      setDeleting(null);
    }
  };
  return (
    <ul className="flex flex-col">
      {orders.map((o) => {
        const isOpen = open === o.id;
        return (
          <li key={o.id} className="border-b border-bone/10">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : o.id)}
              className="w-full flex items-center gap-3 py-3 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-bone text-sm truncate">
                    {o.orderNumber}
                  </p>
                  <span
                    className={`text-[9px] uppercase tracking-[0.15em] px-1.5 py-px border ${
                      o.paymentMethod === "cash"
                        ? "border-emerald-400/40 text-emerald-400"
                        : "border-bone/20 text-bone-dim"
                    }`}
                  >
                    {o.paymentMethod}
                  </span>
                  {o.hasMissingCost ? (
                    <span className="text-[9px] uppercase tracking-[0.15em] px-1.5 py-px border border-oxblood/40 text-oxblood">
                      cost?
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] text-bone-dim truncate">
                  {fmtDate(o.createdAt)} · {o.customerName || "—"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display text-bone text-sm">{fmt(o.total)}</p>
                <p
                  className={`text-[10px] uppercase tracking-[0.15em] ${
                    o.profit >= 0 ? "text-emerald-400" : "text-oxblood"
                  }`}
                >
                  {o.profit >= 0 ? "+" : ""}
                  {fmt(o.profit)}
                </p>
              </div>
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className={`text-bone-dim transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen ? (
              <div className="bg-charcoal/30 px-3 py-3 mb-2 text-xs font-body text-bone flex flex-col gap-1">
                {o.items.map((it, i) => (
                  <p key={i} className="text-bone-dim">
                    · {it.name} × {it.qty}
                    {it.chainName ? ` (${it.chainName})` : ""}
                  </p>
                ))}
                <div className="border-t border-bone/10 mt-2 pt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-bone-dim">Subtotal</span><span className="text-right">{fmt(o.subtotal)}</span>
                  <span className="text-bone-dim">Shipping charged</span><span className="text-right">{fmt(o.shipping)}</span>
                  <span className="text-bone-dim">Gateway fee</span><span className="text-right">−{fmt(o.gatewayFee)}</span>
                  <span className="text-bone-dim">COGS</span><span className="text-right">−{fmt(o.cogs)}</span>
                  <span className="text-bone-dim">Courier paid</span><span className="text-right">−{fmt(o.merchantCost)}</span>
                  <span className="text-gold">Profit</span>
                  <span className={`text-right ${o.profit >= 0 ? "text-emerald-400" : "text-oxblood"}`}>
                    {fmt(o.profit)}
                  </span>
                </div>
                {o.customerInstagram ? (
                  <p className="text-bone-dim mt-1">@{o.customerInstagram}</p>
                ) : null}
                <div className="border-t border-bone/10 mt-3 pt-3">
                  <button
                    type="button"
                    onClick={() => remove(o.orderNumber)}
                    disabled={deleting === o.orderNumber}
                    className="inline-flex items-center gap-2 px-3 py-1.5
                               border border-oxblood/40 text-oxblood
                               hover:bg-oxblood/10 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={12} strokeWidth={1.5} />
                    <span className="eyebrow text-[10px]">
                      {deleting === o.orderNumber ? "Deleting…" : "Delete order"}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ExpensesTable({
  expenses,
  onChange,
}: {
  expenses: FinanceExpense[];
  onChange: () => void | Promise<void>;
}) {
  const [deleting, setDeleting] = useState<number | null>(null);
  if (expenses.length === 0) {
    return <p className="font-serif italic text-bone-dim text-sm">No expenses logged yet.</p>;
  }
  const remove = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
      await onChange();
    } finally {
      setDeleting(null);
    }
  };
  return (
    <ul className="flex flex-col">
      {expenses.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-3 py-3 border-b border-bone/10"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="font-display text-bone text-sm">
                {EXPENSE_CATEGORY_LABEL[e.category]}
              </p>
              <p className="text-[10px] text-bone-dim">{fmtDate(e.occurredAt)}</p>
            </div>
            {e.description ? (
              <p className="text-xs text-bone-dim truncate">{e.description}</p>
            ) : null}
          </div>
          <p className="font-display text-bone text-sm">−{fmt(e.amount)}</p>
          <button
            type="button"
            onClick={() => remove(e.id)}
            disabled={deleting === e.id}
            aria-label="Delete expense"
            className="grid place-items-center w-7 h-7 border border-bone/20
                       text-bone-dim hover:text-oxblood hover:border-oxblood
                       transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ───── Cash-order form ──────────────────────────────────────────────── */

function CashOrderForm({
  onDone,
  onCancel,
}: {
  onDone: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const products = useProducts();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [picked, setPicked] = useState<Array<{ slug: string; qty: number }>>([]);
  const [merchantCost, setMerchantCost] = useState("");
  const [notes, setNotes] = useState("");
  const [chargeShipping, setChargeShipping] = useState(false);
  const [occurredAt, setOccurredAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const bySlug = useMemo(() => {
    const m: Record<string, Product> = {};
    for (const p of products) m[p.slug] = p;
    return m;
  }, [products]);

  const total = useMemo(
    () =>
      picked.reduce((s, l) => {
        const p = bySlug[l.slug];
        return s + (p?.price ?? 0) * l.qty;
      }, 0),
    [picked, bySlug]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const taken = new Set(picked.map((p) => p.slug));
    return products
      .filter((p) => !taken.has(p.slug) && p.price != null)
      .filter((p) =>
        !q || p.name.toLowerCase().includes(q) || p.slug.includes(q)
      )
      .slice(0, 8);
  }, [products, query, picked]);

  const add = (slug: string) => {
    setPicked((cur) => [...cur, { slug, qty: 1 }]);
    setQuery("");
  };
  const setQty = (slug: string, qty: number) =>
    setPicked((cur) =>
      cur.map((l) => (l.slug === slug ? { ...l, qty: Math.max(1, qty) } : l))
    );
  const remove = (slug: string) =>
    setPicked((cur) => cur.filter((l) => l.slug !== slug));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (picked.length === 0) {
      setErr("Add at least one product.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/cash-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim() || "Cash sale",
          customer_phone: phone.trim(),
          customer_instagram: instagram.trim(),
          items: picked,
          merchant_cost: merchantCost === "" ? null : Number(merchantCost),
          occurred_at: occurredAt,
          notes: notes.trim(),
          charge_shipping: chargeShipping,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error || "Save failed");
        return;
      }
      await onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onCancel}
        className="self-start eyebrow text-bone-dim hover:text-gold"
      >
        ← Back
      </button>
      <h2 className="font-display uppercase text-bone text-2xl">Cash order</h2>
      <p className="font-serif italic text-bone-dim text-xs -mt-3">
        Manually log a friend / in-person sale. Lands in the same orders ledger as online sales, decrements stock, no gateway fee.
      </p>

      <Field label="Customer name" value={name} onChange={setName} placeholder="e.g. Aarav" />
      <Field label="Phone (optional)" value={phone} onChange={setPhone} placeholder="+91…" type="tel" inputMode="tel" />
      <Field label="Instagram (optional)" value={instagram} onChange={setInstagram} placeholder="@handle" />

      {/* Picked items */}
      {picked.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {picked.map((l) => {
            const p = bySlug[l.slug];
            return (
              <li key={l.slug} className="flex items-center gap-3 border border-bone/15 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-bone text-sm truncate">
                    {p?.name ?? l.slug}
                  </p>
                  <p className="text-[10px] text-bone-dim">
                    {fmt(p?.price ?? 0)} each
                  </p>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={l.qty}
                  onChange={(e) => setQty(l.slug, Number(e.target.value) || 1)}
                  className="w-14 bg-transparent border-b border-bone/30 text-bone text-center py-1
                             focus:outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() => remove(l.slug)}
                  aria-label="Remove"
                  className="grid place-items-center w-7 h-7 border border-bone/20
                             text-bone-dim hover:text-oxblood hover:border-oxblood transition-colors"
                >
                  <Trash2 size={12} strokeWidth={1.5} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Picker */}
      <div>
        <Field label="Add product" value={query} onChange={setQuery} placeholder="Search…" />
        {matches.length > 0 ? (
          <ul className="flex flex-col border border-bone/10 mt-2 max-h-64 overflow-y-auto">
            {matches.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => add(p.slug)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-gold/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-bone text-sm truncate">{p.name}</p>
                    <p className="text-[10px] text-bone-dim">
                      {fmt(p.price ?? 0)} · {p.category}
                    </p>
                  </div>
                  <Plus size={14} className="text-gold" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={chargeShipping}
          onChange={(e) => setChargeShipping(e.target.checked)}
          className="w-5 h-5 accent-gold"
        />
        <span className="font-body text-bone text-sm">
          Charge shipping (uncheck for in-person handover)
        </span>
      </label>

      <Field
        label="My cost on this order (₹, optional)"
        value={merchantCost}
        onChange={setMerchantCost}
        placeholder="packaging, courier paid out-of-pocket"
        type="tel"
        inputMode="numeric"
        help="Subtracted from profit. Leave blank if none."
      />

      <Field
        label="Date"
        value={occurredAt}
        onChange={setOccurredAt}
        placeholder="YYYY-MM-DD"
      />

      <label className="block">
        <span className="block mb-2 font-body text-bone text-sm font-semibold">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                     font-body text-bone resize-none focus:outline-none focus:border-gold"
        />
      </label>

      <div className="border-t border-bone/10 pt-4 flex items-baseline justify-between">
        <span className="eyebrow text-gold">Total</span>
        <span className="font-display text-bone text-2xl">{fmt(total)}</span>
      </div>

      {err ? (
        <div className="border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
          {err}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="self-start inline-flex items-center justify-center gap-2 px-8 py-4
                   bg-gold text-ink eyebrow text-ink
                   disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Log cash sale"}
      </button>
    </form>
  );
}

/* ───── Expense form ─────────────────────────────────────────────────── */

function ExpenseForm({
  onDone,
  onCancel,
}: {
  onDone: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<ExpenseCategory>("advertising");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!amount.trim()) {
      setErr("Amount is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          description: description.trim(),
          occurred_at: occurredAt,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error || "Save failed");
        return;
      }
      await onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 max-w-md">
      <button
        type="button"
        onClick={onCancel}
        className="self-start eyebrow text-bone-dim hover:text-gold"
      >
        ← Back
      </button>
      <h2 className="font-display uppercase text-bone text-2xl">Expense</h2>

      <label className="block">
        <span className="block mb-2 font-body text-bone text-sm font-semibold">
          Category
        </span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                     font-body text-bone text-lg
                     focus:outline-none focus:border-gold"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-ink text-bone">
              {EXPENSE_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Amount (₹)"
        value={amount}
        onChange={setAmount}
        placeholder="e.g. 500"
        type="tel"
        inputMode="numeric"
      />

      <Field
        label="What for?"
        value={description}
        onChange={setDescription}
        placeholder="e.g. Instagram boost — monster keychains campaign"
      />

      <Field label="Date" value={occurredAt} onChange={setOccurredAt} placeholder="YYYY-MM-DD" />

      {err ? (
        <div className="border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
          {err}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="self-start inline-flex items-center justify-center gap-2 px-8 py-4
                   bg-gold text-ink eyebrow text-ink
                   disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Log expense"}
      </button>
    </form>
  );
}

/* ───── Shared field ─────────────────────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "tel" | "email";
  inputMode?: "text" | "numeric" | "tel" | "email";
  help?: string;
}) {
  return (
    <label className="block">
      <span className="block mb-2 font-body text-bone text-sm font-semibold">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                   font-body text-bone text-lg
                   placeholder:text-bone-dim/50
                   focus:outline-none focus:border-gold transition-colors"
      />
      {help ? <p className="mt-1 text-[10px] text-bone-dim font-body">{help}</p> : null}
    </label>
  );
}
