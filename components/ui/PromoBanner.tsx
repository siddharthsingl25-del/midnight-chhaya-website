"use client";

/**
 * Countdown promo banner.
 *
 * Renders at the very top of every page (above the Header). Auto-hides
 * the moment ACTIVE_OFFER.deadlineIso passes — no manual flag-toggle
 * needed when the deal ends. Refreshes the countdown once a second.
 */

import { useEffect, useState } from "react";
import { ACTIVE_OFFER } from "@/lib/site";

const DEADLINE_MS = new Date(ACTIVE_OFFER.deadlineIso).getTime();

function format(remaining: number): string {
  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  return `${h}h ${m}m ${s}s`;
}

export default function PromoBanner() {
  // Render nothing until mount; otherwise SSR + client time can mismatch
  // and React hydrates with a flicker.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = DEADLINE_MS - Date.now();
      setRemaining(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;
  if (remaining <= 0) return null;

  return (
    <div
      className="relative z-[60] w-full bg-gold text-ink py-2 px-4
                 text-center text-[11px] sm:text-xs uppercase tracking-[0.18em]
                 font-medium border-b border-gold-soft"
    >
      <strong className="font-bold">{ACTIVE_OFFER.title}</strong>
      <span className="mx-2 opacity-60">·</span>
      <span>{ACTIVE_OFFER.subtitle}</span>
      <span className="mx-2 opacity-60">·</span>
      <span className="font-mono normal-case tracking-normal">
        {format(remaining)} left
      </span>
    </div>
  );
}
