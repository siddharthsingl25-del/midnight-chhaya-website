/**
 * GET /api/telegram/setup
 *
 * One-time helper: tells Telegram where the bot's webhook lives. Open
 * this URL in a browser after deploying + setting the env vars. Returns
 * Telegram's response so you can see if it worked.
 *
 * Admin-cookie-gated so randos can't repoint your bot.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { telegramEnv } from "@/lib/telegram";
import { SITE } from "@/lib/site";

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { token, webhookSecret, ownerChatId } = telegramEnv();
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not set" },
      { status: 500 }
    );
  }
  if (!ownerChatId) {
    return NextResponse.json(
      { error: "TELEGRAM_OWNER_CHAT_ID not set" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const baseUrl =
    url.searchParams.get("base") ?? SITE.url.replace(/\/$/, "");
  const webhookUrl = `${baseUrl}/api/telegram/webhook`;

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret || undefined,
      allowed_updates: ["message", "edited_message"],
      drop_pending_updates: true,
    }),
  });
  const tgJson = await tgRes.json().catch(() => ({}));
  return NextResponse.json({
    webhookUrl,
    secretConfigured: Boolean(webhookSecret),
    telegram: tgJson,
  });
}
