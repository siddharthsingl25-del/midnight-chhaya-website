"use client";

/**
 * Reusable image-upload widget.
 *
 *   - Tap (mobile) or click (desktop) → opens file picker
 *   - Drag-and-drop a file from the file manager → drops onto the widget
 *
 * The selected file is POSTed to /api/admin/upload; the returned
 * public URL is handed to onUploaded. Same flow whether the file
 * came from the picker, the camera, or a drag.
 */

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";

export default function ImageUpload({
  value,
  onUploaded,
  folder = "misc",
  label = "Photo",
}: {
  value?: string | null;
  onUploaded: (url: string) => void;
  folder?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const pick = () => inputRef.current?.click();

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image file.");
      return;
    }
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || "Upload failed");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      onUploaded(url);
    } finally {
      setUploading(false);
    }
  };

  /* Shared drag handlers — wired on both the empty drop zone and the
   * existing-image overlay so replacing via drag also works. */
  const dragHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // hint that drop is allowed
      e.dataTransfer.dropEffect = "copy";
      if (!dragging) setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only clear when the cursor truly leaves the drop zone, not when
      // it moves between child elements.
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void upload(file);
    },
  };

  return (
    <div>
      <span className="block mb-2 font-body text-bone text-sm font-semibold">
        {label}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = ""; // allow re-picking the same file
        }}
      />

      {value ? (
        <div
          {...dragHandlers}
          className={[
            "relative w-full max-w-md aspect-[4/5] bg-charcoal overflow-hidden",
            "border-2 transition-colors duration-200",
            dragging ? "border-gold border-dashed" : "border-transparent",
          ].join(" ")}
        >
          <Image src={value} alt="" fill sizes="(min-width:640px) 28rem, 90vw" className="object-cover" />
          {dragging ? (
            <div className="absolute inset-0 bg-ink/70 grid place-items-center pointer-events-none">
              <span className="eyebrow text-gold">Drop to replace</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={pick}
              disabled={uploading}
              className="absolute inset-0 bg-ink/60 opacity-0 hover:opacity-100
                         transition-opacity grid place-items-center"
              aria-label="Replace photo"
            >
              <span className="eyebrow text-bone text-[10px]">
                {uploading ? "Uploading…" : "Click or drag to replace"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onUploaded("")}
            className="absolute top-2 right-2 grid place-items-center w-7 h-7
                       bg-ink/80 text-bone hover:bg-oxblood transition-colors"
            aria-label="Remove photo"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          {...dragHandlers}
          className={[
            "flex flex-col items-center justify-center gap-3 w-full max-w-md aspect-[4/5]",
            "border-2 border-dashed transition-colors duration-200",
            dragging
              ? "border-gold bg-gold/5 text-gold"
              : "border-bone/30 text-bone-dim hover:border-gold hover:text-gold",
            "disabled:opacity-60",
          ].join(" ")}
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Upload size={24} strokeWidth={1.5} />
          )}
          <span className="eyebrow text-[10px] text-center px-4">
            {uploading
              ? "Uploading…"
              : dragging
                ? "Drop to upload"
                : "Click to upload · or drag a photo here"}
          </span>
        </button>
      )}

      {error ? <p className="mt-2 text-xs text-oxblood">{error}</p> : null}
    </div>
  );
}
