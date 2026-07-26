"use client";

/**
 * Orders tab — fulfilment portal.
 *
 * Every order in one list. Expand a row to:
 *   - see the customer + items
 *   - flip status: paid → shipped → delivered
 *   - enter tracking id + courier partner
 *   - each status change auto-emails the customer with the tracking info
 *
 * Newest orders first. Status pill filter across the top so it's easy
 * to find what still needs shipping.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Check, Truck, PackageCheck, Printer } from "lucide-react";

type Order = {
  id: number;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_instagram: string;
  delivery_address: string;
  items: Array<{
    name: string;
    qty: number;
    chainName?: string | null;
    unitPrice?: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: "online" | "cash" | "cod";
  status: "paid" | "shipped" | "delivered" | "refunded" | "cancelled";
  tracking_id: string | null;
  courier_partner: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  label_printed_at: string | null;
  notes: string;
};

type StatusFilter = "all" | "paid" | "shipped" | "delivered";

const STATUS_LABEL: Record<Order["status"], string> = {
  paid: "New / Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<Order["status"], string> = {
  paid: "border-gold/60 text-gold bg-gold/5",
  shipped: "border-emerald-400/60 text-emerald-400 bg-emerald-400/5",
  delivered: "border-bone/40 text-bone bg-bone/5",
  refunded: "border-oxblood/40 text-oxblood",
  cancelled: "border-bone/20 text-bone-dim",
};

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function AdminOrders() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (!res.ok) {
      setErr((await res.json().catch(() => ({}))).error ?? "Load failed");
      setLoading(false);
      return;
    }
    const d = (await res.json()) as { rows: Order[] };
    setRows(d.rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: rows.length, paid: 0, shipped: 0, delivered: 0 };
    for (const r of rows) {
      if (r.status === "paid") c.paid++;
      else if (r.status === "shipped") c.shipped++;
      else if (r.status === "delivered") c.delivered++;
    }
    return c;
  }, [rows]);

  const unprintedPaidCount = useMemo(
    () => rows.filter((r) => r.status === "paid" && !r.label_printed_at).length,
    [rows]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "paid", "shipped", "delivered"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  "eyebrow px-3 py-2 border text-[10px] transition-colors",
                  active
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-bone/20 text-bone-dim hover:text-bone",
                ].join(" ")}
              >
                {f === "all" ? "All" : STATUS_LABEL[f as Order["status"]]}
                <span className="ml-2 opacity-60">{counts[f]}</span>
              </button>
            );
          })}
        </div>
        {unprintedPaidCount > 0 ? (
          <a
            href="/api/admin/orders/labels?status=paid"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setTimeout(() => void load(), 1500)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-ink eyebrow text-[10px]"
          >
            <Printer size={12} strokeWidth={1.75} />
            Print {unprintedPaidCount} new label{unprintedPaidCount === 1 ? "" : "s"}
          </a>
        ) : counts.paid > 0 ? (
          <span className="eyebrow text-[10px] text-bone-dim">
            All {counts.paid} paid label{counts.paid === 1 ? "" : "s"} already printed
          </span>
        ) : null}
      </div>

      {err ? (
        <div className="border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
          {err}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="font-serif italic text-bone-dim text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="font-serif italic text-bone-dim text-sm">
          No orders in this view.
        </p>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              isOpen={openId === o.id}
              onToggle={() => setOpenId(openId === o.id ? null : o.id)}
              onChanged={load}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({
  order,
  isOpen,
  onToggle,
  onChanged,
}: {
  order: Order;
  isOpen: boolean;
  onToggle: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [trackingId, setTrackingId] = useState(order.tracking_id ?? "");
  const [courier, setCourier] = useState(order.courier_partner ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? "");
  const [email, setEmail] = useState(order.customer_email ?? "");
  const [address, setAddress] = useState(order.delivery_address ?? "");
  const [busy, setBusy] = useState<null | "shipped" | "delivered" | "save">(null);
  const [msg, setMsg] = useState("");
  const [togglingLabel, setTogglingLabel] = useState(false);

  const toggleLabelPrinted = async () => {
    setTogglingLabel(true);
    try {
      await fetch(`/api/admin/orders/${encodeURIComponent(order.order_number)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: order.status,
          label_printed: !order.label_printed_at,
          send_email: false,
        }),
      });
      await onChanged();
    } finally {
      setTogglingLabel(false);
    }
  };

  const patch = async (
    next: Order["status"],
    kind: "shipped" | "delivered" | "save"
  ) => {
    setBusy(kind);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.order_number)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          tracking_id: trackingId.trim() || null,
          courier_partner: courier.trim() || null,
          tracking_url: trackingUrl.trim() || null,
          customer_email: email.trim(),
          delivery_address: address.trim(),
          send_email: kind !== "save",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        email?: { ok?: boolean; skipped?: boolean; error?: string; attempted?: boolean };
      };
      if (!res.ok) {
        setMsg(data.error || "Update failed");
        return;
      }
      const em = data.email;
      if (em?.attempted) {
        if (em.ok) setMsg("Saved · email sent to customer ✓");
        else if (em.skipped) setMsg("Saved · email skipped (no address or SMTP not set)");
        else setMsg(`Saved but email failed: ${em.error ?? "unknown"}`);
      } else {
        setMsg("Saved ✓");
      }
      await onChanged();
    } finally {
      setBusy(null);
    }
  };

  const printed = !!order.label_printed_at;

  return (
    <li className="border-b border-bone/10">
      <div className="w-full flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 min-w-0 flex items-center gap-3 text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="font-display text-bone text-sm">{order.order_number}</p>
              <span
                className={`text-[9px] uppercase tracking-[0.15em] px-1.5 py-px border ${STATUS_COLOR[order.status]}`}
              >
                {STATUS_LABEL[order.status]}
              </span>
              <span className="text-[9px] uppercase tracking-[0.15em] text-bone-dim border border-bone/15 px-1.5 py-px">
                {order.payment_method}
              </span>
            </div>
            <p className="text-[10px] text-bone-dim truncate">
              {fmtDate(order.created_at)} · {order.customer_name || "—"}{order.customer_email ? ` · ${order.customer_email}` : ""}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display text-bone text-sm">{fmt(order.total)}</p>
          </div>
        </button>

        {/* Label-printed tick — sits outside the expand button so it
         * doesn't fire the row toggle. Click toggles the timestamp. */}
        <label
          className={`flex-shrink-0 flex items-center gap-1.5 cursor-pointer select-none px-2 py-1 border transition-colors ${
            printed
              ? "border-emerald-400/60 text-emerald-400 bg-emerald-400/5"
              : "border-bone/25 text-bone-dim hover:text-bone"
          } ${togglingLabel ? "opacity-50" : ""}`}
          title={printed ? `Printed ${fmtDate(order.label_printed_at!)}` : "Not printed yet"}
        >
          <input
            type="checkbox"
            checked={printed}
            disabled={togglingLabel}
            onChange={toggleLabelPrinted}
            className="w-3 h-3 accent-emerald-400"
          />
          <span className="text-[9px] uppercase tracking-[0.15em]">
            {printed ? "Printed" : "Print"}
          </span>
        </label>

        <button
          type="button"
          onClick={onToggle}
          className="flex-shrink-0"
          aria-label="Expand"
        >
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className={`text-bone-dim transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen ? (
        <div className="bg-charcoal/30 px-3 py-4 mb-2 text-xs font-body text-bone flex flex-col gap-4">
          {/* Item list */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-bone-dim mb-1">Items</p>
            {order.items.map((it, i) => (
              <p key={i} className="text-bone-dim">
                · {it.name} × {it.qty}
                {it.chainName ? ` (${it.chainName})` : ""}
              </p>
            ))}
          </div>

          {/* Customer + address — email & address are editable so you
           * can fix them for orphan-recovered orders where they didn't
           * get captured. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-bone-dim">Phone</p>
              <p className="text-bone">{order.customer_phone || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-bone-dim">Instagram</p>
              <p className="text-bone">{order.customer_instagram ? `@${order.customer_instagram}` : "—"}</p>
            </div>
          </div>
          <label className="block">
            <span className="block mb-1 text-[10px] uppercase tracking-[0.15em] text-bone-dim">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full bg-transparent border-b border-bone/30 px-1 py-2
                         font-body text-bone text-sm
                         focus:outline-none focus:border-gold transition-colors"
            />
          </label>
          <label className="block">
            <span className="block mb-1 text-[10px] uppercase tracking-[0.15em] text-bone-dim">
              Delivery address
            </span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address including pincode"
              rows={3}
              className="w-full bg-transparent border border-bone/20 px-2 py-2
                         font-body text-bone text-sm resize-none
                         focus:outline-none focus:border-gold transition-colors"
            />
          </label>
          {(order.customer_email !== email || order.delivery_address !== address) ? (
            <button
              type="button"
              onClick={() => patch(order.status, "save")}
              disabled={busy !== null}
              className="self-start inline-flex items-center gap-2 px-3 py-1.5
                         border border-bone/30 text-bone-dim hover:text-bone
                         disabled:opacity-60"
            >
              <Check size={12} strokeWidth={1.75} />
              <span className="eyebrow text-[10px]">
                {busy === "save" ? "Saving…" : "Save email + address (no email fires)"}
              </span>
            </button>
          ) : null}

          {/* Tracking */}
          <div className="border-t border-bone/10 pt-4 flex flex-col gap-3">
            <p className="eyebrow text-gold text-[11px]">Shipping</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block mb-1 text-[10px] uppercase tracking-[0.15em] text-bone-dim">
                  Courier partner
                </span>
                <input
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="e.g. Delhivery"
                  className="w-full bg-transparent border-b border-bone/30 px-1 py-2
                             font-body text-bone text-sm
                             focus:outline-none focus:border-gold transition-colors"
                />
              </label>
              <label className="block">
                <span className="block mb-1 text-[10px] uppercase tracking-[0.15em] text-bone-dim">
                  Tracking ID
                </span>
                <input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="AWB / consignment #"
                  className="w-full bg-transparent border-b border-bone/30 px-1 py-2
                             font-body text-bone text-sm font-mono
                             focus:outline-none focus:border-gold transition-colors"
                />
              </label>
            </div>
            <label className="block">
              <span className="block mb-1 text-[10px] uppercase tracking-[0.15em] text-bone-dim">
                Tracking URL (optional, used in the email button)
              </span>
              <input
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://delhivery.com/track/…"
                className="w-full bg-transparent border-b border-bone/30 px-1 py-2
                           font-body text-bone text-sm
                           focus:outline-none focus:border-gold transition-colors"
              />
            </label>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              <a
                href={`/api/admin/orders/${encodeURIComponent(order.order_number)}/label`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTimeout(() => void onChanged(), 1500)}
                className={
                  order.label_printed_at
                    ? "inline-flex items-center gap-2 px-4 py-2 border border-bone/20 text-bone-dim hover:text-bone hover:bg-bone/5"
                    : "inline-flex items-center gap-2 px-4 py-2 border border-bone/40 text-bone hover:bg-bone/5"
                }
              >
                <Printer size={12} strokeWidth={1.75} />
                <span className="eyebrow text-[10px]">
                  {order.label_printed_at
                    ? `Reprint label (printed ${fmtDate(order.label_printed_at)})`
                    : "Print / download label"}
                </span>
              </a>

              {order.status !== "shipped" && order.status !== "delivered" ? (
                <button
                  type="button"
                  onClick={() => patch("shipped", "shipped")}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-ink disabled:opacity-60"
                >
                  <Truck size={12} strokeWidth={1.75} />
                  <span className="eyebrow text-[10px]">
                    {busy === "shipped" ? "Sending…" : "Mark shipped + email"}
                  </span>
                </button>
              ) : null}

              {order.status === "shipped" ? (
                <button
                  type="button"
                  onClick={() => patch("delivered", "delivered")}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gold text-gold hover:bg-gold/5 disabled:opacity-60"
                >
                  <PackageCheck size={12} strokeWidth={1.75} />
                  <span className="eyebrow text-[10px]">
                    {busy === "delivered" ? "Sending…" : "Mark delivered + email"}
                  </span>
                </button>
              ) : null}

              {(order.tracking_id !== trackingId || order.courier_partner !== courier || order.tracking_url !== trackingUrl) ? (
                <button
                  type="button"
                  onClick={() => patch(order.status, "save")}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-bone/30 text-bone-dim hover:text-bone disabled:opacity-60"
                >
                  <Check size={12} strokeWidth={1.75} />
                  <span className="eyebrow text-[10px]">
                    {busy === "save" ? "Saving…" : "Save tracking (no email)"}
                  </span>
                </button>
              ) : null}
            </div>

            {msg ? (
              <p className={`text-[10px] mt-1 ${msg.includes("failed") ? "text-oxblood" : "text-emerald-400"}`}>
                {msg}
              </p>
            ) : null}
          </div>

          {order.shipped_at ? (
            <p className="text-[10px] text-bone-dim">Shipped: {fmtDate(order.shipped_at)}</p>
          ) : null}
          {order.delivered_at ? (
            <p className="text-[10px] text-bone-dim">Delivered: {fmtDate(order.delivered_at)}</p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
