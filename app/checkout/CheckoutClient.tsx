"use client";

/**
 * Checkout — client UI.
 *
 * Two columns on desktop, stacked on mobile:
 *   - Left: delivery details form (name, Instagram, address, city, pin, notes)
 *   - Right: order summary (cart lines with chains, qty, line totals, total)
 *
 * Submit handler builds the order text + POSTs it to ntfy.sh on the
 * merchant's private topic, then shows a thank-you screen. The merchant
 * gets an instant push notification on their phone via the ntfy app.
 *
 * Cart only clears on the explicit "Clear cart" action — we don't wipe
 * it before confirmation.
 *
 * To wire real payments later: replace `placeOrder` with a fetch to your
 * payment gateway (Razorpay / Stripe / Shopify) using `cart.items` and
 * `cart.total()` plus the form values, and keep the ntfy ping as an
 * order-received notification.
 */

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ShoppingBag } from "lucide-react";
import Reveal from "@/components/animations/Reveal";
import { easeCinematic } from "@/lib/animations";
import { useCart } from "@/lib/cart";
import { computeShipping, formatPrice, SHIPPING_THRESHOLD, SITE } from "@/lib/site";

type Form = {
  name: string;
  instagram: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pin: string;
  notes: string;
};

const EMPTY: Form = {
  name: "",
  instagram: "",
  phone: "",
  email: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pin: "",
  notes: "",
};

type Status = "idle" | "submitting" | "ready";

export default function CheckoutClient() {
  const { detailed, total, clear, count } = useCart();
  const lines = detailed();
  const subtotal = total();
  const shipping = computeShipping(subtotal);
  const grandTotal = subtotal + shipping;
  const [form, setForm] = useState<Form>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [orderText, setOrderText] = useState<string>("");

  const set = (k: keyof Form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const buildOrderText = () => {
    const items = lines
      .map(({ line, product, chain, unitPrice }) => {
        const chainSuffix = chain ? `\n   Chain: ${chain.name}` : "";
        const price =
          unitPrice == null
            ? "Inquire"
            : `${formatPrice(unitPrice)} × ${line.qty} = ${formatPrice(unitPrice * line.qty)}`;
        return `• ${product.name}${chainSuffix}\n   ${price}`;
      })
      .join("\n");

    const address = [
      form.address1,
      form.address2,
      `${form.city}${form.state ? ", " + form.state : ""}${form.pin ? " - " + form.pin : ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    return [
      `Hi Midnight Chhaya — I'd like to place an order:`,
      ``,
      items,
      ``,
      `Subtotal: ${formatPrice(subtotal)}`,
      `Shipping: ${shipping === 0 ? "Free" : formatPrice(shipping)}`,
      `Total: ${formatPrice(grandTotal)}`,
      ``,
      `— Customer —`,
      `Name: ${form.name}`,
      `Instagram: ${form.instagram}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      ``,
      `— Deliver to —`,
      address,
      form.notes ? `\n— Notes —\n${form.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const placeOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lines.length === 0) return;
    setStatus("submitting");
    const text = buildOrderText();
    setOrderText(text);

    /* Ping the merchant's ntfy.sh topic so they get an instant phone
     * push notification. Headers control the notification's title,
     * priority, and tag (shopping bag emoji). Body is the order text.
     *
     * IMPORTANT: HTTP header values must be ASCII-only. The rupee
     * symbol and middle dot we use in the visible UI cannot live in
     * the Title header — browsers reject the fetch. Use "Rs." and
     * dashes here; full UTF-8 is fine in the body.
     *
     * If the network call fails (offline, ad-blocker, etc.) we still
     * show the success screen so the customer isn't penalised — the
     * order text is exposed in <details> so they can copy and send
     * to us on Instagram as a manual fallback. */
    const asciiName = (form.name || "anon").replace(/[^\x20-\x7E]/g, "");
    const asciiTitle = `New order - Rs.${grandTotal} - ${asciiName}`;
    try {
      await fetch(`https://ntfy.sh/${SITE.notifyTopic}`, {
        method: "POST",
        headers: {
          "Title": asciiTitle,
          "Priority": "high",
          "Tags": "shopping_bags,sparkles",
        },
        body: text,
      });
    } catch {
      /* swallowed — success screen still shows */
    }

    // brief delay so the spinner feels intentional
    await new Promise((r) => setTimeout(r, 400));
    setStatus("ready");
  };

  // —— EMPTY CART STATE ————————————————————————————
  if (count === 0 && status !== "ready") {
    return (
      <section className="px-6 md:px-10 pb-32">
        <div className="mx-auto max-w-2xl text-center py-24 flex flex-col items-center gap-8">
          <ShoppingBag size={36} strokeWidth={1.25} className="text-bone-dim" />
          <h2 className="font-display uppercase text-bone text-3xl md:text-4xl">
            Your cart is empty.
          </h2>
          <p className="font-serif italic text-bone-dim text-lg max-w-md">
            Find a piece you like — add it to the cart — then come back here
            to place the order.
          </p>
          <Link
            href="/collections"
            data-cursor="See all"
            className="eyebrow text-gold gold-underline"
          >
            See all pieces →
          </Link>
        </div>
      </section>
    );
  }

  // —— CONFIRMATION STATE ————————————————————————————
  if (status === "ready") {
    return (
      <section className="px-6 md:px-10 pb-32">
        <div className="mx-auto max-w-2xl text-center py-16 flex flex-col items-center gap-8">
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: easeCinematic }}
            className="grid place-items-center w-14 h-14 rounded-full border border-gold text-gold"
          >
            <Check size={24} strokeWidth={1.5} />
          </motion.span>
          <h2 className="font-display uppercase text-bone text-3xl md:text-4xl">
            Order received.
          </h2>
          <p className="font-serif italic text-bone-dim text-lg max-w-md leading-relaxed">
            Your order has been sent to us. We&apos;ll reach out on Instagram
            at <strong className="not-italic font-semibold text-bone">{form.instagram || "your handle"}</strong> within a day to confirm
            availability and arrange payment + delivery.
          </p>

          <details className="text-left w-full max-w-md mt-2">
            <summary className="eyebrow text-bone-dim cursor-pointer hover:text-bone transition-colors">
              View order summary
            </summary>
            <pre className="mt-3 p-4 bg-charcoal border border-bone/10 text-xs text-bone-dim font-body whitespace-pre-wrap break-words">
              {orderText}
            </pre>
          </details>

          <div className="flex gap-6 mt-4">
            <Link
              href="/collections"
              data-cursor="Browse"
              className="eyebrow text-bone-dim hover:text-bone transition-colors"
            >
              ← Keep browsing
            </Link>
            <button
              type="button"
              onClick={() => clear()}
              data-cursor="Clear"
              className="eyebrow text-bone-dim hover:text-oxblood transition-colors"
            >
              Clear cart
            </button>
          </div>
        </div>
      </section>
    );
  }

  // —— ACTIVE CHECKOUT STATE ————————————————————————————
  return (
    <section className="px-6 md:px-10 pb-32">
      <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* form */}
        <form onSubmit={placeOrder} className="lg:col-span-7 flex flex-col gap-10">
          <Reveal>
            <Link
              href="/collections"
              data-cursor="Back"
              className="inline-flex items-center gap-2 eyebrow text-bone-dim hover:text-gold transition-colors duration-500 mb-2"
            >
              <ArrowLeft size={14} /> Keep browsing
            </Link>
          </Reveal>

          <fieldset className="flex flex-col gap-8">
            <legend className="font-display uppercase text-gold text-xl md:text-2xl tracking-wide mb-4">
              Customer
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => set("name", v)}
                required
                autoComplete="name"
              />
              <Field
                label="Instagram handle"
                value={form.instagram}
                onChange={(v) => set("instagram", v)}
                required
                placeholder="@yourname"
              />
              <Field
                label="Phone number"
                value={form.phone}
                onChange={(v) => set("phone", v)}
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(v) => set("email", v)}
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-8">
            <legend className="font-display uppercase text-gold text-xl md:text-2xl tracking-wide mb-4">
              Deliver to
            </legend>
            <div className="flex flex-col gap-8">
              <Field
                label="Address line 1"
                value={form.address1}
                onChange={(v) => set("address1", v)}
                required
                autoComplete="address-line1"
                placeholder="House / flat number, street"
              />
              <Field
                label="Address line 2"
                value={form.address2}
                onChange={(v) => set("address2", v)}
                autoComplete="address-line2"
                placeholder="Area, landmark (optional)"
              />
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr] gap-x-6 gap-y-8">
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => set("city", v)}
                  required
                  autoComplete="address-level2"
                />
                <Field
                  label="State"
                  value={form.state}
                  onChange={(v) => set("state", v)}
                  required
                  autoComplete="address-level1"
                />
                <Field
                  label="PIN"
                  value={form.pin}
                  onChange={(v) => set("pin", v)}
                  required
                  autoComplete="postal-code"
                  inputMode="numeric"
                />
              </div>
              <Field
                label="Notes (optional)"
                value={form.notes}
                onChange={(v) => set("notes", v)}
                multiline
                placeholder="Anything we should know about delivery, gift wrap, customisation"
              />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={lines.length === 0 || status === "submitting"}
            data-cursor="Place order"
            data-cursor-magnetic
            className="self-start inline-flex items-center gap-3 px-8 py-4
                       bg-gold text-ink min-w-[260px] justify-center
                       transition-all duration-500
                       hover:shadow-[0_0_36px_-6px_rgba(184,147,90,0.6)]
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={status}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: easeCinematic }}
                className="eyebrow text-ink"
              >
                {status === "submitting" ? "Preparing…" : `Place order · ${formatPrice(grandTotal)}`}
              </motion.span>
            </AnimatePresence>
          </button>

          <p className="font-serif italic text-bone-dim text-sm max-w-md leading-relaxed">
            Online checkout is coming soon. Placing the order sends it
            directly to us — we&apos;ll DM you on Instagram within a day to
            confirm availability and arrange payment + delivery.
          </p>
        </form>

        {/* order summary */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-32 bg-charcoal/60 border border-bone/10 p-6 md:p-8">
            <h2 className="eyebrow text-gold mb-6">Order summary</h2>

            <ul className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
              {lines.map(({ line, product, chain, unitPrice }) => (
                <li
                  key={`${line.slug}|${line.chainId ?? ""}`}
                  className="flex gap-4 pb-5 border-b border-bone/5 last:border-b-0 last:pb-0"
                >
                  <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden bg-ink">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-display text-sm text-bone truncate">
                      {product.name}
                    </span>
                    {chain ? (
                      <span className="block text-[10px] uppercase tracking-[0.2em] text-gold-soft mt-0.5">
                        {chain.name}
                      </span>
                    ) : null}
                    <span className="block text-xs text-bone-dim mt-1">
                      Qty {line.qty}
                    </span>
                  </div>
                  <span className="text-sm text-bone whitespace-nowrap">
                    {unitPrice != null
                      ? formatPrice(unitPrice * line.qty)
                      : "Inquire"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-bone/10 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-bone-dim">Subtotal</span>
                <span className="text-sm text-bone">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-bone-dim">Shipping</span>
                <span className={`text-sm ${shipping === 0 ? "text-gold" : "text-bone"}`}>
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 ? (
                <p className="text-[10px] text-bone-dim italic">
                  Add {formatPrice(SHIPPING_THRESHOLD - subtotal)} more to your cart for free shipping.
                </p>
              ) : null}
              <div className="flex items-baseline justify-between pt-3 mt-1 border-t border-bone/10">
                <span className="eyebrow text-bone-dim">Total</span>
                <span className="font-display text-2xl text-bone">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* —— Field ———————————————————————————————————————— */

function Field({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  placeholder,
  autoComplete,
  inputMode,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  type?: "text" | "tel" | "email";
}) {
  /* Bigger, bolder inputs for checkout — easy to read while filling. */
  const shared =
    "w-full bg-transparent border-b-2 border-bone/30 px-1 py-3 " +
    "font-body text-bone text-lg md:text-xl font-medium " +
    "placeholder:text-bone-dim/50 placeholder:font-normal " +
    "focus:outline-none focus:border-gold transition-colors duration-500";

  return (
    <label className="relative block">
      <span className="block mb-3 font-body text-bone text-base font-semibold tracking-wide">
        {label}{" "}
        {required ? <span className="text-gold ml-0.5">*</span> : null}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={3}
          placeholder={placeholder}
          className={`${shared} resize-none`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={shared}
        />
      )}
    </label>
  );
}
