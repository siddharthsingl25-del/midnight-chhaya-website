"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { useProducts } from "@/lib/catalog-context";
import { CATEGORIES, type Category, type Product } from "@/lib/types";
import { easeCinematic } from "@/lib/animations";

type Filter = Category | "all";
type Audience = "all" | "women";
type SortKey = "featured" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  "featured": "Featured",
  "price-asc": "Price · Low to high",
  "price-desc": "Price · High to low",
};

export default function CollectionsGrid() {
  const router = useRouter();
  const params = useSearchParams();

  const fromUrl = (params.get("cat") ?? "all") as Filter;
  const valid = CATEGORIES.some((c) => c.id === fromUrl);
  const audienceFromUrl: Audience =
    params.get("audience") === "women" ? "women" : "all";
  const [active, setActive] = useState<Filter>(valid ? fromUrl : "all");
  const [audience, setAudience] = useState<Audience>(audienceFromUrl);
  const [sort, setSort] = useState<SortKey>("featured");

  useEffect(() => {
    const fromUrl = (params.get("cat") ?? "all") as Filter;
    if (CATEGORIES.some((c) => c.id === fromUrl)) setActive(fromUrl);
    setAudience(params.get("audience") === "women" ? "women" : "all");
  }, [params]);

  const buildHref = (cat: Filter, aud: Audience) => {
    const query: string[] = [];
    if (cat !== "all") query.push(`cat=${cat}`);
    if (aud === "women") query.push("audience=women");
    return query.length ? `/collections?${query.join("&")}` : "/collections";
  };

  const onSelect = (id: Filter) => {
    setActive(id);
    // Switching category clears the audience filter — it only makes
    // sense alongside chains for now.
    const nextAudience = id === "chains" ? audience : "all";
    setAudience(nextAudience);
    router.replace(buildHref(id, nextAudience), { scroll: false });
  };

  const onAudience = (aud: Audience) => {
    setAudience(aud);
    router.replace(buildHref(active, aud), { scroll: false });
  };

  const products = useProducts();

  const items = useMemo<Product[]>(() => {
    let base =
      active === "all"
        ? products
        : products.filter((p) => p.category === active);
    if (audience === "women") base = base.filter((p) => p.forWomen);
    if (sort === "featured") return base;
    // Null prices ("Inquire") always sink to the end regardless of direction.
    return [...base].sort((a, b) => {
      const pa = a.price ?? Number.POSITIVE_INFINITY;
      const pb = b.price ?? Number.POSITIVE_INFINITY;
      return sort === "price-asc" ? pa - pb : pb - pa;
    });
  }, [active, audience, sort, products]);

  /* The audience sub-filter ("All / Women") only makes sense when the
   * customer is already inside Chains. Hidden everywhere else. */
  const showAudienceTabs = active === "chains";

  return (
    <section className="px-6 md:px-10 pb-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 border-b border-bone/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* category filter */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {CATEGORIES.map((c) => {
              const selected = c.id === active;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  data-cursor={c.label}
                  className={[
                    "relative eyebrow transition-colors duration-500",
                    selected ? "text-gold" : "text-bone-dim hover:text-bone",
                  ].join(" ")}
                >
                  {c.label}
                  {selected ? (
                    <motion.span
                      layoutId="cat-underline"
                      className="absolute -bottom-[26px] left-0 right-0 h-px bg-gold"
                      transition={{ duration: 0.5, ease: easeCinematic }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* sort */}
          <SortMenu value={sort} onChange={setSort} />
        </div>

        {/* Audience sub-filter — only on Chains */}
        {showAudienceTabs ? (
          <div className="mb-12 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="eyebrow text-bone-dim/70">For</span>
            {(["all", "women"] as Audience[]).map((a) => {
              const selected = a === audience;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => onAudience(a)}
                  data-cursor={a === "all" ? "Everyone" : "Women"}
                  className={[
                    "eyebrow transition-colors duration-500",
                    selected ? "text-gold" : "text-bone-dim hover:text-bone",
                  ].join(" ")}
                >
                  {a === "all" ? "Everyone" : "Women"}
                </button>
              );
            })}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${active}-${sort}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: easeCinematic }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-6 md:gap-x-10 gap-y-10 sm:gap-y-16"
          >
            {items.map((p, i) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  ease: easeCinematic,
                  delay: i * 0.06,
                }}
              >
                <ProductCard product={p} priority={i < 3} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {items.length === 0 ? (
          active === "bracelets" || active === "rings" ? (
            <div className="text-center py-32">
              <span className="eyebrow block mb-6 text-gold">
                {active === "bracelets" ? "Bracelets" : "Rings"}
              </span>
              <p className="font-display uppercase text-bone text-[clamp(2rem,6vw,4rem)] leading-[1.05]">
                Coming soon.
              </p>
              <p className="font-serif italic text-bone-dim text-lg mt-6 max-w-md mx-auto">
                Forged at the bench. Watch this space.
              </p>
            </div>
          ) : (
            <p className="font-serif italic text-bone-dim text-center py-32">
              No pieces in this category yet — check back soon.
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}

/* ---- Sort menu ----------------------------------------------------------- */

function SortMenu({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (s: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative self-start sm:self-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-cursor="Sort"
        className="inline-flex items-center gap-2 eyebrow text-bone-dim hover:text-gold transition-colors duration-500"
      >
        <span>Sort</span>
        <span className="text-bone-dim/60">·</span>
        <span className="text-bone">{SORT_LABELS[value]}</span>
        <ChevronDown
          size={12}
          strokeWidth={1.75}
          className={`text-gold transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeCinematic }}
            className="absolute right-0 mt-3 z-40 min-w-[220px]
                       bg-ink/95 backdrop-blur-md border border-bone/10
                       py-2"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => {
              const selected = k === value;
              return (
                <li key={k}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(k);
                      setOpen(false);
                    }}
                    data-cursor={SORT_LABELS[k]}
                    className={[
                      "flex w-full items-center justify-between gap-3 px-4 py-2.5",
                      "font-body text-sm transition-colors duration-300",
                      selected
                        ? "text-gold"
                        : "text-bone-dim hover:text-bone hover:bg-gold/5",
                    ].join(" ")}
                  >
                    <span>{SORT_LABELS[k]}</span>
                    {selected ? <Check size={14} strokeWidth={1.75} /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
