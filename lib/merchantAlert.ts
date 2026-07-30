/**
 * Redundant merchant push. Sends every order alert via BOTH ntfy AND
 * Telegram in parallel — if one channel is down (ntfy.sh outage, phone
 * subscription drift, Telegram bot throttle), the other still fires.
 *
 * Payment notifications must never depend on a single delivery channel.
 * Both calls are fire-and-forget with individual error swallowing so a
 * flaky HTTP hop can't take down the calling route.
 */

import { SITE } from "@/lib/site";
import { sendTelegramMessage, telegramEnv } from "@/lib/telegram";

export type MerchantAlert = {
  /** Short line shown on lock screen. Keep ASCII-safe for ntfy. */
  title: string;
  /** Full body. Multi-line OK. */
  body: string;
  /** ntfy priority: default | high | max */
  priority?: "default" | "high" | "max";
  /** ntfy tag(s), comma-separated */
  tags?: string;
};

export async function sendMerchantAlert(alert: MerchantAlert): Promise<void> {
  const asciiTitle = alert.title.replace(/[^\x20-\x7E]/g, "") || "Order alert";

  const ntfyPromise = fetch(`https://ntfy.sh/${SITE.notifyTopic}`, {
    method: "POST",
    headers: {
      Title: asciiTitle,
      Priority: alert.priority ?? "high",
      Tags: alert.tags ?? "shopping_bags,sparkles",
    },
    body: alert.body,
  }).catch((e) => {
    console.error("[merchantAlert.ntfy]", e);
  });

  const { ownerChatId } = telegramEnv();
  const telegramPromise = ownerChatId
    ? sendTelegramMessage(
        ownerChatId,
        `<b>${escapeHtml(asciiTitle)}</b>\n\n${escapeHtml(alert.body)}`
      ).catch((e) => {
        console.error("[merchantAlert.telegram]", e);
      })
    : Promise.resolve();

  // Kick both off in parallel; don't await the network — the route
  // that called us has already done its important work (order saved).
  void Promise.allSettled([ntfyPromise, telegramPromise]);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
