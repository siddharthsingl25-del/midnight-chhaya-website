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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
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

  const filtered = useMemo(() => {
    if (!filter.trim()) return products;
    const q = filter.trim().toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.includes(q)
    );
  }, [filter, products]);

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

      <ul className="flex flex-col">
        {filtered.map((p) => (
          <li
            key={p.slug}
            className="flex items-center gap-4 py-4 border-b border-bone/10"
          >
            <button
              type="button"
              onClick={() => setMode({ kind: "edit", slug: p.slug })}
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
          </li>
        ))}
      </ul>
    </>
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
  const [shortDesc, setShortDesc] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState(product?.images[0] ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [exclusive, setExclusive] = useState(product?.exclusive ?? false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
      short_description: shortDesc.trim(),
      description: description.trim(),
      images: [image],
      featured,
      exclusive,
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

      <Field
        label="Name *"
        value={name}
        onChange={setName}
        placeholder="e.g. Red Cross Chain"
      />

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
        label="Price (₹)"
        value={price}
        onChange={setPrice}
        placeholder="e.g. 300 · leave blank for 'Inquire'"
        type="tel"
        inputMode="numeric"
      />

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
          checked={exclusive}
          onChange={(e) => setExclusive(e.target.checked)}
          className="w-5 h-5 accent-gold"
        />
        <span className="font-body text-bone text-sm">
          Show on Exclusives page
        </span>
      </label>

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
