/**
 * Merchant push notifications — ntfy primary, Telegram as silent fallback.
 *
 * Reliability layers:
 *   1. Retry ntfy 3 times with exponential backoff (immediate → +2s → +6s).
 *      Handles transient network drops + brief ntfy.sh 5xx blips.
 *   2. Send an `X-Message-Id` header so ntfy de-dups if a retry lands
 *      after the original succeeded.
 *   3. Set Priority: max and Tags for high-priority ordering, so the phone
 *      doesn't defer the alert.
 *   4. Include a Click action URL — tapping the notification jumps
 *      straight to the admin order page.
 *   5. If ALL three ntfy attempts fail (network partition, ntfy.sh down),
 *      fall back to Telegram — you keep ntfy as primary, but never miss
 *      an order.
 *   6. Every attempt is console-logged with status so Vercel logs give
 *      an audit trail if anything ever fails.
 *
 * Payment routes call sendMerchantAlert() and don't await — the order
 * has already saved by that point; alert delivery is best-effort.
 */

import { SITE } from "@/lib/site";
import { sendTelegramMessage, telegramEnv } from "@/lib/telegram";

export type MerchantAlert = {
  /** Short line shown on lock screen. Keep ASCII-safe for ntfy. */
  title: string;
  /** Full body. Multi-line OK. */
  body: string;
  /** ntfy priority: default | high | max. Defaults to max. */
  priority?: "default" | "high" | "max";
  /** ntfy tag(s), comma-separated. Defaults to shopping_bags,sparkles. */
  tags?: string;
  /** Optional order number — used as the message-id (de-dup key) and
   * used to build the "click to open admin order" URL. */
  orderNumber?: string;
};

const NTFY_MAX_ATTEMPTS = 3;
const NTFY_BACKOFF_MS = [0, 2000, 6000]; // per-attempt delay

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  return new Promise((r) => setTimeout(r, ms));
}

async function attemptNtfy(alert: MerchantAlert, asciiTitle: string): Promise<boolean> {
  const headers: Record<string, string> = {
    Title: asciiTitle,
    Priority: alert.priority ?? "max",
    Tags: alert.tags ?? "shopping_bags,sparkles",
  };
  if (alert.orderNumber) {
    // ntfy uses X-Message-Id (or lowercase) as an idempotency key when
    // Cache: yes. A retry with the same id becomes a no-op if the
    // first attempt already stored the message.
    headers["X-Message-Id"] = alert.orderNumber;
    headers["Click"] = `${SITE.url}/admin`;
  }
  const res = await fetch(`https://ntfy.sh/${SITE.notifyTopic}`, {
    method: "POST",
    headers,
    body: alert.body,
  });
  return res.ok;
}

export async function sendMerchantAlert(alert: MerchantAlert): Promise<void> {
  const asciiTitle = alert.title.replace(/[^\x20-\x7E]/g, "") || "Order alert";
  const tag = alert.orderNumber ? `[${alert.orderNumber}]` : "";

  // Fire ntfy in the background with retry-and-backoff.
  void (async () => {
    for (let i = 0; i < NTFY_MAX_ATTEMPTS; i++) {
      await sleep(NTFY_BACKOFF_MS[i] ?? 0);
      try {
        const ok = await attemptNtfy(alert, asciiTitle);
        if (ok) {
          if (i > 0) console.log(`[ntfy] ${tag} ok on retry #${i}`);
          return;
        }
        console.warn(`[ntfy] ${tag} non-2xx on attempt #${i + 1}`);
      } catch (e) {
        console.warn(`[ntfy] ${tag} threw on attempt #${i + 1}:`, e);
      }
    }
    // All ntfy attempts failed — fall through to Telegram as emergency
    // fallback so the merchant never misses an order.
    console.error(`[ntfy] ${tag} FAILED after ${NTFY_MAX_ATTEMPTS} attempts, falling back to Telegram`);
    const { ownerChatId } = telegramEnv();
    if (ownerChatId) {
      try {
        await sendTelegramMessage(
          ownerChatId,
          `<b>⚠ ntfy failed · fallback</b>\n\n<b>${escapeHtml(asciiTitle)}</b>\n\n${escapeHtml(alert.body)}`
        );
        console.log(`[merchantAlert] ${tag} Telegram fallback sent`);
      } catch (e) {
        console.error(`[merchantAlert] ${tag} Telegram fallback ALSO failed:`, e);
      }
    } else {
      console.error(`[merchantAlert] ${tag} no Telegram configured — alert LOST`);
    }
  })();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
