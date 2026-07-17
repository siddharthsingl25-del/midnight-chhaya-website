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
import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ShoppingBag } from "lucide-react";
import Reveal from "@/components/animations/Reveal";
import { easeCinematic } from "@/lib/animations";
import { useCart } from "@/lib/cart";
import { useStockRefresh } from "@/lib/stock";
import {
  ACTIVE_OFFER,
  COD_CHARGE,
  computeBogoDiscount,
  computeShipping,
  computeShippingForCart,
  formatPrice,
  offerActiveAt,
  SHIPPING_THRESHOLD,
  SITE,
} from "@/lib/site";

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

type Status = "idle" | "submitting" | "ready" | "error";

export default function CheckoutClient() {
  const { detailed, total, clear, count } = useCart();
  const refreshStock = useStockRefresh();
  const lines = detailed();
  const subtotal = total();

  /* Live BOGO discount tied to ACTIVE_OFFER. Recomputes on each render
   * so the cart auto-updates as items go in/out; auto-disables the
   * moment the deadline passes. */
  const [bogoActive, setBogoActive] = useState(() => offerActiveAt());
  useEffect(() => {
    const id = setInterval(() => setBogoActive(offerActiveAt()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch the FIRST10 promo status once on mount so the checkout can
  // show "Use code FIRST10 — N uses left" as a hint above the discount
  // input. Silently ignored if the code is missing or deactivated.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/promo?code=FIRST10", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          active?: boolean;
          percentOff?: number;
          minSubtotal?: number;
          usesLeft?: number | null;
        };
        if (
          data.active &&
          (data.usesLeft == null || data.usesLeft > 0)
        ) {
          setFirst10({
            active: true,
            percentOff: data.percentOff ?? 0,
            minSubtotal: data.minSubtotal ?? 0,
            usesLeft: data.usesLeft ?? null,
          });
        }
      } catch {
        /* silent */
      }
    })();
  }, []);
  const bogoAmount = bogoActive
    ? computeBogoDiscount(
        lines.map(({ line, unitPrice }) => ({
          eligible: ACTIVE_OFFER.slugMatches.some((m) =>
            line.slug.toLowerCase().includes(m)
          ),
          unitPrice: unitPrice ?? 0,
          qty: line.qty,
        }))
      )
    : 0;

  const [discountCode, setDiscountCode] = useState<string>("");
  const [first10, setFirst10] = useState<{
    active: boolean;
    percentOff: number;
    minSubtotal: number;
    usesLeft: number | null;
  } | null>(null);
  const [appliedCode, setAppliedCode] = useState<{
    code: string;
    percentOff: number;
    amountOff: number;
  } | null>(null);
  const [codeError, setCodeError] = useState<string>("");
  const [codeChecking, setCodeChecking] = useState(false);
  const codeDiscount = appliedCode?.amountOff ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - bogoAmount - codeDiscount);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  /* Pre-order items must be prepaid — a customer can't reserve a
   * launch unit for COD. If any line in the cart is flagged pre-order,
   * COD is locked out and the payment method snaps back to online. */
  const cartHasPreOrder = lines.some(({ product }) => product.isPreOrder);
  useEffect(() => {
    if (cartHasPreOrder && paymentMethod === "cod") {
      setPaymentMethod("online");
    }
  }, [cartHasPreOrder, paymentMethod]);
  /* COD skips shipping entirely — the customer just pays the ₹250 COD fee
   * upfront and the product subtotal in cash on delivery. Prepaid
   * shipping is category-aware: heavy items (glasses) get flat ₹150. */
  const shipping =
    paymentMethod === "cod"
      ? 0
      : computeShippingForCart(
          lines.map(({ product }) => ({ category: product.category })),
          discountedSubtotal
        );
  const codCharge = paymentMethod === "cod" ? COD_CHARGE : 0;
  const grandTotal = discountedSubtotal + shipping + codCharge;
  const amountDueNow = paymentMethod === "cod" ? codCharge : grandTotal;
  const amountDueOnDelivery =
    paymentMethod === "cod" ? discountedSubtotal : 0;
  const [form, setForm] = useState<Form>(EMPTY);
  const [status, setStatus] = useState<Status>("idle");
  const [orderText, setOrderText] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const applyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;
    setCodeChecking(true);
    setCodeError("");
    try {
      const res = await fetch("/api/checkout/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        valid?: boolean;
        percentOff?: number;
        amountOff?: number;
        error?: string;
      };
      if (!res.ok || !data.valid) {
        setCodeError(data.error || "Code not valid");
        setAppliedCode(null);
        return;
      }
      setAppliedCode({
        code,
        percentOff: data.percentOff ?? 10,
        amountOff: data.amountOff ?? 0,
      });
      setCodeError("");
    } finally {
      setCodeChecking(false);
    }
  };

  const removeDiscount = () => {
    setAppliedCode(null);
    setDiscountCode("");
    setCodeError("");
  };

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

  /** Lazy-load Razorpay's checkout script on first click. */
  const loadRazorpay = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      const w = window as unknown as { Razorpay?: unknown };
      if (w.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const placeOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lines.length === 0) return;
    setStatus("submitting");
    setErrorMsg("");
    const text = buildOrderText();
    setOrderText(text);

    const asciiName = (form.name || "anon").replace(/[^\x20-\x7E]/g, "");
    const asciiTitle = `Paid - Rs.${grandTotal} - ${asciiName}`;

    const itemsForVerify = lines.map(({ line }) => ({
      slug: line.slug,
      qty: line.qty,
      chainId: line.chainId,
    }));

    /* Structured snapshot for the customer-facing email + WhatsApp.
     * paymentId is filled in server-side after signature verification. */
    const addressText = [
      form.address1,
      form.address2,
      `${form.city}${form.state ? ", " + form.state : ""}${form.pin ? " - " + form.pin : ""}`,
    ]
      .filter(Boolean)
      .join("\n");
    const snapshot = {
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
      },
      items: lines.map(({ product, chain, line, unitPrice }) => ({
        slug: product.slug,
        chainId: chain?.id ?? null,
        name: product.name,
        chainName: chain?.name ?? null,
        qty: line.qty,
        unitPrice,
      })),
      subtotal,
      shipping,
      total: grandTotal,
      address: addressText,
    };

    /* Shared post-payment confirmation: POST to verify with the
     * Razorpay signature, then update UI based on result. */
    const confirmPayment = async (resp: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...resp,
            items: itemsForVerify,
            orderText: text,
            titleSummary: asciiTitle,
            snapshot,
            instagram: form.instagram,
            notes: form.notes,
            paymentMethod,
            prepaidAmount: amountDueNow,
            amountDueOnDelivery,
            appliedPromoCode: createData.appliedPromoCode ? createData.appliedCode : null,
          }),
        });
        if (!verifyRes.ok) {
          const data = (await verifyRes.json().catch(() => ({}))) as {
            error?: string;
            paymentId?: string;
          };
          setErrorMsg(
            `Payment succeeded but post-payment processing failed. Save this Payment ID and message us on Instagram: ${data.paymentId ?? resp.razorpay_payment_id}`
          );
          setStatus("error");
          return;
        }
        const verifyData = (await verifyRes.json().catch(() => ({}))) as {
          orderNumber?: string;
          paymentId?: string;
        };
        setOrderNumber(verifyData.orderNumber ?? verifyData.paymentId ?? resp.razorpay_payment_id);
        await refreshStock();
        setStatus("ready");
      } catch {
        setErrorMsg(
          `Network error during verification. Your payment may have gone through — save Payment ID ${resp.razorpay_payment_id} and message us on Instagram.`
        );
        setStatus("error");
      }
    };

    /* 1. Server creates a Razorpay order using authoritative prices.
     *    Also stock-checks here so we don't open a payment modal for
     *    items that just sold out. */
    let createData: {
      razorpayOrderId: string;
      amountPaise: number;
      currency: string;
      keyId: string;
      appliedCode?: string | null;
      appliedPromoCode?: boolean;
    };
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map(({ line }) => ({
            slug: line.slug,
            qty: line.qty,
            chainId: line.chainId,
          })),
          customer: {
            name: form.name,
            instagram: form.instagram,
            phone: form.phone,
            email: form.email,
          },
          discountCode: appliedCode?.code,
          paymentMethod,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          slug?: string;
          name?: string;
        };
        if (res.status === 409 && data.slug) {
          setErrorMsg(
            `Sorry — ${data.name ?? data.slug} just went out of stock. Remove it from your cart and try again.`
          );
        } else {
          setErrorMsg(data.error || "Could not start payment. Please try again.");
        }
        await refreshStock();
        setStatus("error");
        return;
      }
      createData = await res.json();
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
      return;
    }

    /* 2. Load Razorpay's checkout script and open the modal. */
    const ok = await loadRazorpay();
    if (!ok) {
      setErrorMsg("Couldn't load the payment widget. Disable ad-blockers and retry.");
      setStatus("error");
      return;
    }

    const RazorpayCtor = (window as unknown as {
      Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
    }).Razorpay;

    const rzp = new RazorpayCtor({
      key: createData.keyId,
      amount: createData.amountPaise,
      currency: createData.currency,
      order_id: createData.razorpayOrderId,
      name: SITE.name,
      description: `${lines.length} item${lines.length === 1 ? "" : "s"}`,
      image: SITE.logoPath,
      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone,
      },
      notes: { instagram: form.instagram },
      theme: { color: "#b8935a" },

      /* Razorpay calls this after a successful payment. We verify the
       * signature server-side, decrement stock, and ping ntfy. */
      handler: confirmPayment,

      /* If the customer closes the modal without paying, return to idle
       * so they can retry without a stuck spinner. */
      modal: {
        ondismiss: () => {
          setStatus("idle");
        },
      },
    });

    rzp.open();
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

          {orderNumber ? (
            <div className="border border-gold/40 bg-gold/5 px-8 py-5 flex flex-col items-center gap-1">
              <span className="eyebrow text-bone-dim">Your order number</span>
              <span className="font-display text-gold text-3xl md:text-4xl tracking-[0.08em]">
                {orderNumber}
              </span>
              <span className="font-serif italic text-bone-dim text-xs mt-1">
                Save this — quote it for any support query.
              </span>
            </div>
          ) : null}

          <p className="font-serif italic text-bone-dim text-lg max-w-md leading-relaxed">
            Payment confirmed. A confirmation has been sent to your email and WhatsApp. Your order ships within 1–3 business days —
            we&apos;ll DM <strong className="not-italic font-semibold text-bone">{form.instagram || "your Instagram"}</strong> with the tracking link as soon as it&apos;s dispatched.
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

          {status === "error" && errorMsg ? (
            <div className="border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
              {errorMsg}
            </div>
          ) : null}

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
                {status === "submitting"
                  ? "Opening payment…"
                  : `Pay · ${formatPrice(amountDueNow)}${paymentMethod === "cod" ? " now" : ""}`}
              </motion.span>
            </AnimatePresence>
          </button>

          <p className="font-serif italic text-bone-dim text-sm max-w-md leading-relaxed">
            Secure payment via Razorpay — UPI, cards, netbanking, wallets all
            supported. Your order ships within 1–3 business days; we&apos;ll DM
            you on Instagram with tracking once dispatched.
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
              {bogoAmount > 0 ? (
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-gold">
                    {ACTIVE_OFFER.title} · {ACTIVE_OFFER.subtitle}
                  </span>
                  <span className="text-sm text-gold">
                    −{formatPrice(bogoAmount)}
                  </span>
                </div>
              ) : null}
              {appliedCode ? (
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-gold inline-flex items-center gap-2">
                    {appliedCode.percentOff}% off · {appliedCode.code}
                    <button
                      type="button"
                      onClick={removeDiscount}
                      className="text-bone-dim hover:text-oxblood transition-colors text-[10px] underline"
                      aria-label="Remove discount code"
                    >
                      remove
                    </button>
                  </span>
                  <span className="text-sm text-gold">
                    −{formatPrice(appliedCode.amountOff)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-bone-dim">Shipping</span>
                <span className={`text-sm ${shipping === 0 ? "text-gold" : "text-bone"}`}>
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 ? (
                <p className="text-[10px] text-bone-dim italic">
                  Add {formatPrice(SHIPPING_THRESHOLD - discountedSubtotal)} more to your cart for free shipping.
                </p>
              ) : null}

              {paymentMethod === "cod" ? (
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-bone-dim">COD charge</span>
                  <span className="text-sm text-bone">+{formatPrice(codCharge)}</span>
                </div>
              ) : null}

              {/* Payment method choice */}
              <div className="mt-3 pt-3 border-t border-bone/10 flex flex-col gap-2">
                <span className="eyebrow text-bone-dim">Payment method</span>
                <label className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${paymentMethod === "online" ? "border-gold bg-gold/5" : "border-bone/15 hover:border-bone/30"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    className="accent-gold mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-bone text-sm">Prepaid (online)</p>
                    <p className="text-[10px] text-bone-dim">Pay the full amount now via Razorpay.</p>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 border transition-colors ${
                    cartHasPreOrder
                      ? "border-bone/10 opacity-40 cursor-not-allowed"
                      : paymentMethod === "cod"
                        ? "border-gold bg-gold/5 cursor-pointer"
                        : "border-bone/15 hover:border-bone/30 cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "cod"}
                    disabled={cartHasPreOrder}
                    onChange={() => setPaymentMethod("cod")}
                    className="accent-gold mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-bone text-sm">
                      Cash on Delivery <span className="text-bone-dim">· +{formatPrice(COD_CHARGE)}</span>
                    </p>
                    <p className="text-[10px] text-bone-dim">
                      {cartHasPreOrder
                        ? "Not available — pre-order items must be prepaid."
                        : `Prepay ${formatPrice(COD_CHARGE)} now (COD fee). Pay ${formatPrice(discountedSubtotal)} in cash to the courier on delivery. No shipping charge.`}
                    </p>
                  </div>
                </label>
              </div>

              {/* Discount code input — collapsed when one is applied. */}
              {!appliedCode ? (
                <div className="mt-3 flex flex-col gap-1">
                  {first10 ? (
                    <button
                      type="button"
                      onClick={() => setDiscountCode("FIRST10")}
                      className="text-[11px] text-gold text-left mb-1
                                 hover:underline decoration-gold/60 underline-offset-4"
                    >
                      Use code <span className="font-mono">FIRST10</span> for {first10.percentOff}% off — only for first {first10.usesLeft ?? "few"} people to place an order{first10.minSubtotal > 0 ? ` (min cart ${formatPrice(first10.minSubtotal)})` : ""}.
                    </button>
                  ) : null}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="Discount code (if any)"
                      className="flex-1 bg-transparent border border-bone/20 px-3 py-2
                                 font-body text-bone text-sm uppercase tracking-wide
                                 placeholder:text-bone-dim/50 placeholder:normal-case placeholder:tracking-normal
                                 focus:outline-none focus:border-gold transition-colors"
                    />
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={!discountCode.trim() || codeChecking}
                      className="px-4 py-2 border border-gold/60 text-gold eyebrow text-[10px]
                                 transition-colors duration-300 hover:bg-gold hover:text-ink
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {codeChecking ? "Checking…" : "Apply"}
                    </button>
                  </div>
                  {codeError ? (
                    <p className="text-[10px] text-oxblood mt-1">{codeError}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-baseline justify-between pt-3 mt-1 border-t border-bone/10">
                <span className="eyebrow text-bone-dim">Total</span>
                <span className="font-display text-2xl text-bone">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              {paymentMethod === "cod" ? (
                <div className="mt-3 p-3 border border-gold/30 bg-gold/5 flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow text-gold text-[10px]">Pay now</span>
                    <span className="font-body text-bone text-base">
                      {formatPrice(amountDueNow)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow text-bone-dim text-[10px]">On delivery</span>
                    <span className="font-body text-bone-dim text-base">
                      {formatPrice(amountDueOnDelivery)}
                    </span>
                  </div>
                </div>
              ) : null}
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
