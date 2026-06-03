/**
 * Telegram Bot API helpers.
 *
 * Env vars:
 *   TELEGRAM_BOT_TOKEN       — from @BotFather
 *   TELEGRAM_OWNER_CHAT_ID   — your personal chat id (so nobody else can
 *                              issue commands even if they DM the bot)
 *   TELEGRAM_WEBHOOK_SECRET  — random string used as the secret header
 *                              we set in setWebhook + verify on every
 *                              incoming request. Defence in depth.
 */

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  edited_message?: TgMessage;
};

export type TgMessage = {
  message_id: number;
  from?: { id: number; username?: string; first_name?: string };
  chat: { id: number; type: string };
  date: number;
  text?: string;
};

export function telegramEnv() {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN ?? "",
    ownerChatId: process.env.TELEGRAM_OWNER_CHAT_ID ?? "",
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
  };
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  opts: { replyToMessageId?: number } = {}
): Promise<void> {
  const { token } = telegramEnv();
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_to_message_id: opts.replyToMessageId,
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error("[telegram.sendMessage]", e);
  }
}

export function fmtInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
