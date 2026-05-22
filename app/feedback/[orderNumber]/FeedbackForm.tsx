"use client";

import { useState } from "react";
import { Star, Check } from "lucide-react";

export default function FeedbackForm({ orderNumber }: { orderNumber: string }) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError("Pick a rating first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, rating, comment }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || "Could not submit feedback");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 mt-4">
        <span className="grid place-items-center w-14 h-14 rounded-full border border-gold text-gold">
          <Check size={24} strokeWidth={1.5} />
        </span>
        <p className="font-serif italic text-bone text-lg max-w-md leading-relaxed">
          Thank you. We read every reply.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full flex flex-col gap-6 mt-4">
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`Rate ${n} out of 5`}
              className="p-1 transition-colors"
            >
              <Star
                size={36}
                strokeWidth={1.25}
                className={active ? "text-gold fill-gold" : "text-bone-dim"}
              />
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Tell us what you liked — or didn't. (Optional)"
        className="w-full bg-transparent border border-bone/20 px-3 py-3
                   font-body text-bone text-base resize-none
                   placeholder:text-bone-dim/50
                   focus:outline-none focus:border-gold transition-colors"
      />

      {error ? (
        <div className="border border-oxblood/60 bg-oxblood/10 text-bone px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 px-8 py-4
                   bg-gold text-ink eyebrow text-ink self-center
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
