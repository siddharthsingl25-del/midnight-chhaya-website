"use client";

/**
 * Reviews tab — upload screenshot images of customer reviews. They
 * render on the public /reviews page in a grid, newest first.
 */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

type Review = {
  id: number;
  image_url: string;
  display_order: number;
  created_at: string;
};

export default function AdminReviews() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/admin/reviews", { cache: "no-store" });
    if (!res.ok) {
      setErr((await res.json().catch(() => ({}))).error ?? "Load failed");
      setLoading(false);
      return;
    }
    const d = (await res.json()) as { rows: Review[] };
    setRows(d.rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-submit as soon as an image finishes uploading.
  useEffect(() => {
    if (!pendingImage) return;
    void (async () => {
      setSaving(true);
      setErr("");
      try {
        const res = await fetch("/api/admin/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: pendingImage }),
        });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          setErr(d.error || "Save failed");
          return;
        }
        setPendingImage("");
        await load();
      } finally {
        setSaving(false);
      }
    })();
  }, [pendingImage, load]);

  const remove = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="eyebrow text-gold mb-3">Upload a new review</h2>
        <p className="font-serif italic text-bone-dim text-xs mb-4">
          Screenshot the customer message / Instagram tag / WhatsApp thread, then upload. It shows up on the public /reviews page instantly.
        </p>
        <ImageUpload
          value={pendingImage}
          onUploaded={setPendingImage}
          folder="reviews"
          label={saving ? "Saving…" : "Upload review screenshot"}
        />
      </section>

      {err ? (
        <div className="border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
          {err}
        </div>
      ) : null}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="eyebrow text-gold">Reviews ({rows.length})</h2>
          {loading ? (
            <span className="text-[10px] text-bone-dim">Loading…</span>
          ) : null}
        </div>

        {rows.length === 0 && !loading ? (
          <p className="font-serif italic text-bone-dim text-sm">
            No reviews uploaded yet.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="relative aspect-[3/4] bg-charcoal overflow-hidden group"
              >
                <Image
                  src={r.image_url}
                  alt="Customer review"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={deleting === r.id}
                  aria-label="Delete review"
                  className="absolute top-2 right-2 grid place-items-center w-8 h-8
                             bg-oxblood/80 text-bone
                             opacity-0 group-hover:opacity-100 transition-opacity
                             hover:bg-oxblood disabled:opacity-50"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
