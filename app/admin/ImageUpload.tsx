"use client";

/**
 * Reusable image-upload widget. Tap to pick from gallery / camera,
 * file is POSTed to /api/admin/upload, the returned public URL is
 * handed to onUploaded.
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
  const [error, setError] = useState("");

  const pick = () => inputRef.current?.click();

  const upload = async (file: File) => {
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

  return (
    <label className="block">
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
        <div className="relative w-32 h-40 bg-charcoal overflow-hidden">
          <Image src={value} alt="" fill sizes="128px" className="object-cover" />
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className="absolute inset-0 bg-ink/60 opacity-0 hover:opacity-100
                       transition-opacity grid place-items-center"
            aria-label="Replace photo"
          >
            <span className="eyebrow text-bone text-[10px]">
              {uploading ? "Uploading…" : "Replace"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onUploaded("")}
            className="absolute top-1 right-1 grid place-items-center w-6 h-6
                       bg-ink/80 text-bone hover:bg-oxblood transition-colors"
            aria-label="Remove photo"
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-2 w-32 h-40
                     border border-dashed border-bone/30 text-bone-dim
                     hover:border-gold hover:text-gold
                     transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Upload size={20} strokeWidth={1.5} />
          )}
          <span className="eyebrow text-[10px]">
            {uploading ? "Uploading…" : "Tap to upload"}
          </span>
        </button>
      )}

      {error ? <p className="mt-2 text-xs text-oxblood">{error}</p> : null}
    </label>
  );
}
