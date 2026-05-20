"use client";

/**
 * Chains tab — add / edit / remove chain options that appear on every
 * chain-category product's detail page.
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import ImageUpload from "./ImageUpload";
import { useCatalogRefresh, useChains } from "@/lib/catalog-context";
import type { ChainOption } from "@/lib/types";

type Mode = { kind: "list" } | { kind: "edit"; id: string } | { kind: "new" };

export default function AdminChains() {
  const chains = useChains();
  const refresh = useCatalogRefresh();
  const [mode, setMode] = useState<Mode>({ kind: "list" });

  if (mode.kind === "new") {
    return (
      <ChainForm
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
    const existing = chains.find((c) => c.id === mode.id);
    if (!existing) return null;
    return (
      <ChainForm
        mode="edit"
        chain={existing}
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
        <p className="font-serif italic text-bone-dim text-sm">
          Chain styles offered at checkout. Customers pick one when adding any
          chain-category product to cart.
        </p>
        <button
          type="button"
          onClick={() => setMode({ kind: "new" })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-ink flex-shrink-0"
        >
          <Plus size={14} strokeWidth={1.75} />
          <span className="eyebrow text-[10px] text-ink">New</span>
        </button>
      </div>

      <ul className="flex flex-col">
        {chains.map((c) => (
          <li key={c.id} className="flex items-center gap-4 py-4 border-b border-bone/10">
            <button
              type="button"
              onClick={() => setMode({ kind: "edit", id: c.id })}
              className="flex items-center gap-4 flex-1 min-w-0 text-left"
            >
              <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden bg-charcoal">
                {c.image ? (
                  <Image src={c.image} alt={c.name} fill sizes="56px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-bone text-sm sm:text-base truncate">
                  {c.name}
                </p>
                <p className="text-[10px] text-bone-dim uppercase tracking-[0.15em] truncate">
                  {c.id}
                  {c.priceModifier ? ` · +₹${c.priceModifier}` : ""}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function ChainForm({
  mode,
  chain,
  onDone,
  onCancel,
}: {
  mode: "create" | "edit";
  chain?: ChainOption;
  onDone: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [id, setId] = useState(chain?.id ?? "");
  const [idTouched, setIdTouched] = useState(false);
  const [name, setName] = useState(chain?.name ?? "");
  const [image, setImage] = useState(chain?.image ?? "");
  const [priceModifier, setPriceModifier] = useState<string>(
    chain?.priceModifier ? String(chain.priceModifier) : ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "create" && !idTouched) {
      setId(
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 40)
      );
    }
  }, [name, mode, idTouched]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Name is required");
    if (!id.trim()) return setError("ID is required");
    if (!image) return setError("Photo is required");

    const body = {
      id: id.trim(),
      name: name.trim(),
      image,
      price_modifier: priceModifier === "" ? 0 : Number(priceModifier),
    };

    setSaving(true);
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/chains"
          : `/api/admin/chains/${encodeURIComponent(chain!.id)}`,
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
    if (!chain) return;
    if (!confirm(`Remove "${chain.name}" from the chain picker?`)) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/chains/${encodeURIComponent(chain.id)}`,
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
        <ArrowLeft size={12} /> Back to chains
      </button>

      <h2 className="font-display uppercase text-bone text-2xl">
        {mode === "create" ? "New chain" : chain?.name}
      </h2>

      <ImageUpload value={image} onUploaded={setImage} folder="chains" label="Photo *" />

      <label className="block">
        <span className="block mb-2 font-body text-bone text-sm font-semibold">
          Name *
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. Snake chain · 18"'
          className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                     font-body text-bone text-lg
                     placeholder:text-bone-dim/50
                     focus:outline-none focus:border-gold transition-colors"
        />
      </label>

      <label className="block">
        <span className="block mb-2 font-body text-bone text-sm font-semibold">
          ID *
        </span>
        <input
          value={id}
          onChange={(e) => {
            setIdTouched(true);
            setId(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "")
                .slice(0, 40)
            );
          }}
          disabled={mode === "edit"}
          placeholder="auto-derived from name"
          className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                     font-body text-bone text-lg
                     placeholder:text-bone-dim/50
                     focus:outline-none focus:border-gold transition-colors
                     disabled:text-bone-dim/70 disabled:cursor-not-allowed"
        />
      </label>

      <label className="block">
        <span className="block mb-2 font-body text-bone text-sm font-semibold">
          Price modifier (₹)
        </span>
        <input
          value={priceModifier}
          onChange={(e) => setPriceModifier(e.target.value)}
          placeholder="0 — leave blank or 0 for no extra cost"
          type="tel"
          inputMode="numeric"
          className="w-full bg-transparent border-b-2 border-bone/30 px-1 py-3
                     font-body text-bone text-lg
                     placeholder:text-bone-dim/50
                     focus:outline-none focus:border-gold transition-colors"
        />
        <p className="mt-1 text-[10px] text-bone-dim font-body">
          Added on top of the base product price when this chain is chosen.
        </p>
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
          {saving ? "Saving…" : mode === "create" ? "Create chain" : "Save changes"}
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
