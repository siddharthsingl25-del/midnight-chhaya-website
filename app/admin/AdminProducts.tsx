"use client";

/**
 * Products tab — list all products + form to add new / edit / delete.
 *
 * Designed for phone use: each row tappable, full-screen edit form,
 * image upload via the device camera roll. Saves write to Supabase via
 * /api/admin/products and revalidate the products cache so the public
 * site reflects changes within seconds.
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ImageUpload from "./ImageUpload";
import { useCatalogRefresh, useProducts } from "@/lib/catalog-context";
import type { Category, Product } from "@/lib/types";

const CATEGORY_OPTIONS: Category[] = ["chains", "keychains", "bracelets", "rings"];

type Mode =
  | { kind: "list" }
  | { kind: "edit"; slug: string }
  | { kind: "new" };

export default function AdminProducts() {
  const products = useProducts();
  const refresh = useCatalogRefresh();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [filter, setFilter] = useState("");
  const [moving, setMoving] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filter.trim()) return products;
    const q = filter.trim().toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.includes(q)
    );
  }, [filter, products]);

  /* Swap a product's display_order with its neighbor in the filtered list.
   * Lower display_order = shows first on the storefront. Two PUTs in
   * parallel — display_order isn't unique-constrained so a brief tie
   * is fine. */
  const move = async (slug: string, direction: "up" | "down") => {
    if (moving) return;
    const list = filtered;
    const i = list.findIndex((p) => p.slug === slug);
    if (i === -1) return;
    const swapIdx = direction === "up" ? i - 1 : i + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[i];
    const b = list[swapIdx];
    setMoving(slug);
    try {
      await Promise.all([
        fetch(`/api/admin/products/${encodeURIComponent(a.slug)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_order: b.displayOrder }),
        }),
        fetch(`/api/admin/products/${encodeURIComponent(b.slug)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_order: a.displayOrder }),
        }),
      ]);
      await refresh();
    } finally {
      setMoving(null);
    }
  };

  /* Drag-and-drop reorder. After drop, renumbers every product in the
   * filtered list with sequential display_orders (10, 20, 30 …) so the
   * order on the storefront matches the new visual order. Only PATCHes
   * the products whose order actually changed. */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = filtered.findIndex((p) => p.slug === active.id);
    const newIdx = filtered.findIndex((p) => p.slug === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(filtered, oldIdx, newIdx);
    setMoving(String(active.id));
    try {
      // Assign sequential orders to the new arrangement. Step by 10
      // so future manual inserts can sit in the gaps without a full
      // renumber. Only PATCH products whose order actually changed.
      const updates: Array<{ slug: string; display_order: number }> = [];
      reordered.forEach((p, i) => {
        const next = (i + 1) * 10;
        if (p.displayOrder !== next) {
          updates.push({ slug: p.slug, display_order: next });
        }
      });
      await Promise.all(
        updates.map((u) =>
          fetch(`/api/admin/products/${encodeURIComponent(u.slug)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_order: u.display_order }),
          })
        )
      );
      await refresh();
    } finally {
      setMoving(null);
    }
  };

  if (mode.kind === "new") {
    return (
      <ProductForm
        mode="create"
        onDone={async () => {
          await refresh();
          setMode({ kind: "list" });
        }}
        onCancel={() => setMode({ kind: "list" })}
      />
    );
  }

  if (mode.kind === "edit") {
    const existing = products.find((p) => p.slug === mode.slug);
    if (!existing) return null;
    return (
      <ProductForm
        mode="edit"
        product={existing}
        onDone={async () => {
          await refresh();
          setMode({ kind: "list" });
        }}
        onCancel={() => setMode({ kind: "list" })}
      />
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          className="flex-1 sm:w-80 bg-transparent border-b border-bone/20 px-1 py-3
                     font-body text-bone placeholder:text-bone-dim/50
                     focus:outline-none focus:border-gold transition-colors"
        />
        <button
          type="button"
          onClick={() => setMode({ kind: "new" })}
          className="inline-flex items-center gap-2 px-4 py-2.5
                     bg-gold text-ink"
        >
          <Plus size={14} strokeWidth={1.75} />
          <span className="eyebrow text-[10px] text-ink">New</span>
        </button>
      </div>

      <p className="font-serif italic text-bone-dim text-xs mb-3">
        Long-press the ⠿ handle and drag to reorder. Lower position = shows first on the website. The ↑/↓ buttons still work if you prefer.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={filtered.map((p) => p.slug)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col">
            {filtered.map((p, i) => {
              const isFirst = i === 0;
              const isLast = i === filtered.length - 1;
              const isMoving = moving === p.slug;
              return (
                <SortableProductRow
                  key={p.slug}
                  product={p}
                  isFirst={isFirst}
                  isLast={isLast}
                  isMoving={isMoving}
                  onEdit={() => setMode({ kind: "edit", slug: p.slug })}
                  onMoveUp={() => void move(p.slug, "up")}
                  onMoveDown={() => void move(p.slug, "down")}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}

/* Single sortable row — replaces the inline <li> with one that hooks
 * into dnd-kit's useSortable for drag-and-drop. */
function SortableProductRow({
  product: p,
  isFirst,
  isLast,
  isMoving,
  onEdit,
  onMoveUp,
  onMoveDown,
}: {
  product: Product;
  isFirst: boolean;
  isLast: boolean;
  isMoving: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.slug });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 sm:gap-3 py-4 border-b border-bone/10 ${isDragging ? "bg-gold/5" : ""}`}
    >
      {/* Drag handle — touch-and-hold to pick up */}
      <button
        type="button"
        aria-label={`Drag ${p.name} to reorder`}
        {...attributes}
        {...listeners}
        className="grid place-items-center w-8 h-12 text-bone-dim hover:text-gold
                   transition-colors touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={18} strokeWidth={1.5} />
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-4 flex-1 min-w-0 text-left"
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
            {p.category} · ₹{p.price ?? "—"} · {p.slug}
          </p>
        </div>
      </button>

      {/* Reorder controls — push up/down on the storefront grid */}
      <div className="flex flex-col flex-shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst || isMoving}
          aria-label={`Move ${p.name} up`}
          className="grid place-items-center w-8 h-7 border border-bone/20
                     text-bone-dim hover:border-gold hover:text-gold
                     transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp size={14} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast || isMoving}
          aria-label={`Move ${p.name} down`}
          className="grid place-items-center w-8 h-7 border border-bone/20 border-t-0
                     text-bone-dim hover:border-gold hover:text-gold
                     transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown size={14} strokeWidth={1.75} />
        </button>
      </div>
    </li>
  );
}

/* ───── Edit / Create form ──────────────────────────────────────────── */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function ProductForm({
  mode,
  product,
  onDone,
  onCancel,
}: {
  mode: "create" | "edit";
  product?: Product;
  onDone: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState<Category>(product?.category ?? "chains");
  const [price, setPrice] = useState<string>(
    product?.price != null ? String(product.price) : ""
  );
  const [costPrice, setCostPrice] = useState<string>(
    product?.costPrice != null ? String(product.costPrice) : ""
  );
  const [shortDesc, setShortDesc] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState(product?.images[0] ?? "");
  const [image2, setImage2] = useState(product?.images[1] ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [exclusive, setExclusive] = useState(product?.exclusive ?? false);
  const [forWomen, setForWomen] = useState(product?.forWomen ?? false);
  const [variantKind, setVariantKind] = useState<"" | "chain" | "car">(
    product?.variantKind ?? ""
  );
  const [badgeText, setBadgeText] = useState(product?.badgeText ?? "");
  const [badgeImage, setBadgeImage] = useState(product?.badgeImage ?? "");
  const [relatedSlugs, setRelatedSlugs] = useState<string[]>(
    product?.relatedSlugs ?? []
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  /* Create flow shows just the essentials (photo, name, price). Edit
   * always shows everything since the merchant likely came to change
   * a specific advanced field. */
  const [showMore, setShowMore] = useState(mode === "edit");

  // Auto-derive slug from name in create mode unless user typed it themselves
  useEffect(() => {
    if (mode === "create" && !slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, mode, slugTouched]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Name is required");
    if (!slug.trim()) return setError("Slug is required");
    if (!image) return setError("Photo is required");

    const body = {
      slug: slug.trim(),
      name: name.trim(),
      category,
      price: price === "" ? null : Number(price),
      cost_price: costPrice === "" ? null : Number(costPrice),
      short_description: shortDesc.trim(),
      description: description.trim(),
      images: [image, image2].filter(Boolean),
      featured,
      exclusive,
      for_women: forWomen,
      variant_kind: variantKind || null,
      badge_text: badgeText.trim() || null,
      badge_image: badgeImage.trim() || null,
      related_slugs: relatedSlugs,
    };

    setSaving(true);
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${encodeURIComponent(product!.slug)}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || "Save failed");
        return;
      }
      await onDone();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.slug)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || "Delete failed");
        return;
      }
      await onDone();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <button
        type="button"
        onClick={onCancel}
        className="self-start inline-flex items-center gap-2 eyebrow text-bone-dim hover:text-gold"
      >
        <ArrowLeft size={12} /> Back to products
      </button>

      <h2 className="font-display uppercase text-bone text-2xl">
        {mode === "create" ? "New product" : product?.name}
      </h2>

      <ImageUpload
        value={image}
        onUploaded={setImage}
        folder="products"
        label="Photo *"
      />

      <ImageUpload
        value={image2}
        onUploaded={setImage2}
        folder="products"
        label="Second photo (optional)"
      />
      {image2 ? (
        <button
          type="button"
          onClick={() => setImage2("")}
          className="self-start eyebrow text-bone-dim hover:text-oxblood transition-colors text-[10px]"
        >
          Remove second photo
        </button>
      ) : null}

      <Field
        label="Name *"
        value={name}
        onChange={setName}
        placeholder="e.g. Red Cross Chain"
      />

      <Field
        label="Price (₹)"
        value={price}
        onChange={setPrice}
        placeholder="e.g. 300 · leave blank for 'Inquire'"
        type="tel"
        inputMode="numeric"
      />

      <Field
        label="Cost price (₹) — what this unit costs you"
        value={costPrice}
        onChange={setCostPrice}
        placeholder="e.g. 120 · used to compute profit per order"
        type="tel"
        inputMode="numeric"
        help="Private. Never shown to customers. Powers the Finance dashboard."
      />

      {mode === "create" ? (
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="self-start inline-flex items-center gap-2 eyebrow text-bone-dim hover:text-gold transition-colors"
        >
          <ChevronDown
            size={12}
            strokeWidth={1.75}
            className={`transition-transform duration-300 ${showMore ? "rotate-180" : ""}`}
          />
          {showMore ? "Hide options" : "More options"}
        </button>
      ) : null}

      {showMore ? (
        <>
          <Field
            label="URL slug *"
            value={slug}
            onChange={(v) => {
              setSlugTouched(true);
              setSlug(slugify(v));
            }}
            placeholder="auto-derived from name"
            help={`Becomes /collections/${slug || "your-slug"}`}
            disabled={mode === "edit"}
          />

          <label className="block">
            <span className="block mb-2 font-body text-bone text-sm font-semibold">
              Category *
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                         font-body text-bone text-lg
                         focus:outline-none focus:border-gold transition-colors"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c} className="bg-ink text-bone">
                  {c}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Short description"
            value={shortDesc}
            onChange={setShortDesc}
            placeholder="A one-liner for product cards"
          />

          <label className="block">
            <span className="block mb-2 font-body text-bone text-sm font-semibold">
              Long description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Detailed copy shown on the product page"
              className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                         font-body text-bone text-base resize-none
                         focus:outline-none focus:border-gold transition-colors"
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-5 h-5 accent-gold"
            />
            <span className="font-body text-bone text-sm">
              Show on home page (Featured)
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={forWomen}
              onChange={(e) => setForWomen(e.target.checked)}
              className="w-5 h-5 accent-gold"
            />
            <span className="font-body text-bone text-sm">
              Show in &ldquo;Chains for Women&rdquo; filter
            </span>
          </label>

          {/* Variant picker — opt this product into the variant chooser */}
          <label className="block">
            <span className="block mb-2 font-body text-bone text-sm font-semibold">
              Variant picker on product page
            </span>
            <select
              value={variantKind}
              onChange={(e) => setVariantKind(e.target.value as "" | "chain" | "car")}
              className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                         font-body text-bone text-lg
                         focus:outline-none focus:border-gold transition-colors"
            >
              <option value="" className="bg-ink text-bone">No picker</option>
              <option value="chain" className="bg-ink text-bone">Chains (customer picks a chain)</option>
              <option value="car" className="bg-ink text-bone">Cars (customer picks a car design)</option>
            </select>
            <p className="mt-1 text-[10px] text-bone-dim font-body">
              Choose what the customer picks on this product&apos;s detail page. Most products = No picker. Only set this for products where the customer should choose a specific variant.
            </p>
          </label>

          {/* Related products — manual override of the Related Pieces row
           * shown at the bottom of this product's detail page. Empty = the
           * site falls back to auto-selected category siblings. */}
          <div className="border-t border-bone/10 pt-6 flex flex-col gap-4">
            <p className="eyebrow text-gold">Related products</p>
            <p className="font-serif italic text-bone-dim text-[11px] -mt-2">
              Pick which products show under &ldquo;Related pieces&rdquo; on this product&apos;s page. Drag to reorder. Leave empty to auto-fill from the same category.
            </p>
            <RelatedPicker
              selfSlug={product?.slug}
              value={relatedSlugs}
              onChange={setRelatedSlugs}
            />
          </div>

          {/* Badge / graphic overlay on the product card */}
          <div className="border-t border-bone/10 pt-6 flex flex-col gap-4">
            <p className="eyebrow text-gold">Card badge</p>
            <Field
              label="Badge text"
              value={badgeText}
              onChange={(v) => setBadgeText(v.slice(0, 20))}
              placeholder='e.g. NEW · BEST SELLER · LIMITED'
              help="Shown top-left of the product card. Leave blank for no text badge."
            />
            <ImageUpload
              value={badgeImage}
              onUploaded={setBadgeImage}
              folder="badges"
              label="Badge image (optional · overrides badge text)"
            />
            {badgeImage ? (
              <button
                type="button"
                onClick={() => setBadgeImage("")}
                className="self-start eyebrow text-bone-dim hover:text-oxblood transition-colors text-[10px]"
              >
                Remove badge image
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {error ? (
        <div className="border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-8 py-4
                     bg-gold text-ink eyebrow text-ink
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-3
                       border border-oxblood/40 text-oxblood
                       hover:bg-oxblood/10 disabled:opacity-60"
          >
            <Trash2 size={14} strokeWidth={1.5} />
            <span className="eyebrow text-[10px]">
              {deleting ? "Deleting…" : "Delete"}
            </span>
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  disabled,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "tel" | "email";
  inputMode?: "text" | "numeric" | "tel" | "email";
  disabled?: boolean;
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
        disabled={disabled}
        className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                   font-body text-bone text-lg
                   placeholder:text-bone-dim/50
                   focus:outline-none focus:border-gold transition-colors
                   disabled:text-bone-dim/70 disabled:cursor-not-allowed"
      />
      {help ? (
        <p className="mt-1 text-[10px] text-bone-dim font-body">{help}</p>
      ) : null}
    </label>
  );
}

/* ───── Related products picker ───────────────────────────────────────
 * Search the full product list, click to add to the selected stack,
 * reorder with ↑/↓ on each chip, remove with ×. The selected slugs
 * persist as an ordered text[] on the product row. */
function RelatedPicker({
  selfSlug,
  value,
  onChange,
}: {
  selfSlug?: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const products = useProducts();
  const [query, setQuery] = useState("");
  const byslug = useMemo(() => {
    const m: Record<string, Product> = {};
    for (const p of products) m[p.slug] = p;
    return m;
  }, [products]);
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const taken = new Set(value);
    return products
      .filter((p) => p.slug !== selfSlug && !taken.has(p.slug))
      .filter((p) =>
        !q || p.name.toLowerCase().includes(q) || p.slug.includes(q)
      )
      .slice(0, 8);
  }, [products, query, value, selfSlug]);

  const add = (slug: string) => {
    if (value.includes(slug)) return;
    onChange([...value, slug].slice(0, 12));
    setQuery("");
  };
  const remove = (slug: string) => onChange(value.filter((s) => s !== slug));
  const move = (slug: string, dir: -1 | 1) => {
    const i = value.indexOf(slug);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {value.map((slug, i) => {
            const p = byslug[slug];
            return (
              <li
                key={slug}
                className="flex items-center gap-3 border border-bone/15 px-2 py-1.5"
              >
                <div className="relative w-9 h-11 flex-shrink-0 bg-charcoal overflow-hidden">
                  {p?.images[0] ? (
                    <Image src={p.images[0]} alt="" fill sizes="36px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-bone text-sm truncate">
                    {p?.name ?? slug}
                  </p>
                  <p className="text-[10px] text-bone-dim uppercase tracking-[0.15em] truncate">
                    {p?.category ?? "missing"} · {slug}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => move(slug, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="grid place-items-center w-7 h-7 border border-bone/20
                             text-bone-dim hover:text-gold hover:border-gold transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp size={12} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => move(slug, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Move down"
                  className="grid place-items-center w-7 h-7 border border-bone/20
                             text-bone-dim hover:text-gold hover:border-gold transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown size={12} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(slug)}
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

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products to add…"
        className="w-full bg-transparent border-b border-bone/20 px-1 py-2
                   font-body text-bone text-sm
                   placeholder:text-bone-dim/50
                   focus:outline-none focus:border-gold transition-colors"
      />

      {query.trim() && candidates.length === 0 ? (
        <p className="text-[10px] text-bone-dim italic">No matches.</p>
      ) : null}

      {candidates.length > 0 ? (
        <ul className="flex flex-col border border-bone/10 max-h-72 overflow-y-auto">
          {candidates.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => add(p.slug)}
                className="flex items-center gap-3 w-full text-left px-2 py-1.5
                           hover:bg-gold/5 transition-colors"
              >
                <div className="relative w-9 h-11 flex-shrink-0 bg-charcoal overflow-hidden">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt="" fill sizes="36px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-bone text-sm truncate">{p.name}</p>
                  <p className="text-[10px] text-bone-dim uppercase tracking-[0.15em] truncate">
                    {p.category} · ₹{p.price ?? "—"}
                  </p>
                </div>
                <Plus size={14} strokeWidth={1.75} className="text-gold flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
