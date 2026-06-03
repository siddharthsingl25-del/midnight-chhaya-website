/**
 * POST /api/telegram/webhook
 *
 * Telegram → us. Receives a message from the bot's chat, parses the
 * slash-command, runs the corresponding finance action, replies in the
 * same chat.
 *
 * Security:
 *   1. Telegram sends `X-Telegram-Bot-Api-Secret-Token` (we set it in
 *      setWebhook). Reject if it doesn't match TELEGRAM_WEBHOOK_SECRET.
 *   2. Only the configured owner chat id is allowed to issue commands.
 *      Anyone else gets a polite rejection.
 *
 * Commands:
 *   /sale <product> <qty> [@instagram] [name]   log a cash sale
 *   /expense <category> <amount> [note]         log a non-order expense
 *   /today                                       today's revenue + profit
 *   /month                                       month-to-date P&L
 *   /stock                                       low-stock list (≤5)
 *   /stock <product>                             specific product
 *   /undo                                        delete the most recent
 *                                                cash sale and restore
 *                                                its stock
 *   /help                                        command list
 */

import { NextResponse } from "next/server";
import {
  sendTelegramMessage,
  telegramEnv,
  fmtInr,
  esc,
  type TgUpdate,
  type TgMessage,
} from "@/lib/telegram";
import {
  logCashSale,
  logExpense,
  getStatsForRange,
  findProductByQuery,
  getLowStock,
  getStockBySlug,
  resolveExpenseCategory,
  setOrderMerchantCost,
  undoLastCashOrder,
} from "@/lib/finance-actions";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/types";

export async function POST(req: Request) {
  const env = telegramEnv();
  if (!env.token || !env.ownerChatId) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
  }
  // 1. Verify secret header
  if (env.webhookSecret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== env.webhookSecret) {
      return NextResponse.json({ error: "Bad secret" }, { status: 401 });
    }
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true }); // ignore malformed
  }
  const msg = update.message ?? update.edited_message;
  if (!msg || !msg.text) return NextResponse.json({ ok: true });

  // 2. Owner check — silently drop anything from anyone else.
  const fromId = msg.from?.id;
  if (String(fromId) !== String(env.ownerChatId)) {
    await sendTelegramMessage(
      msg.chat.id,
      "Sorry, this bot is private."
    );
    return NextResponse.json({ ok: true });
  }

  // 3. Dispatch.
  try {
    await handleMessage(msg);
  } catch (e) {
    const err = e instanceof Error ? e.message : "Something broke";
    await sendTelegramMessage(msg.chat.id, `❌ ${esc(err)}`);
  }
  return NextResponse.json({ ok: true });
}

async function handleMessage(msg: TgMessage): Promise<void> {
  const text = (msg.text ?? "").trim();
  // /command@botname args → /command args
  const m = text.match(/^\/(\w+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
  if (!m) {
    await sendTelegramMessage(
      msg.chat.id,
      "Send /help to see what I can do."
    );
    return;
  }
  const cmd = m[1].toLowerCase();
  const args = (m[2] ?? "").trim();
  const chatId = msg.chat.id;

  switch (cmd) {
    case "start":
    case "help":
      return cmdHelp(chatId);
    case "sale":
    case "s":
      return cmdSale(chatId, args);
    case "expense":
    case "e":
      return cmdExpense(chatId, args);
    case "today":
    case "t":
      return cmdToday(chatId);
    case "month":
    case "m":
      return cmdMonth(chatId);
    case "stock":
      return cmdStock(chatId, args);
    case "ship":
      return cmdShip(chatId, args);
    case "undo":
      return cmdUndo(chatId);
    default:
      await sendTelegramMessage(
        chatId,
        `Unknown command: /${esc(cmd)}\nTry /help`
      );
  }
}

/* ─── Commands ───────────────────────────────────────────────────────── */

async function cmdHelp(chatId: number): Promise<void> {
  const text = [
    "<b>Midnight Chhaya · finance bot</b>",
    "",
    "<b>Sales</b>",
    "<code>/sale &lt;product&gt; &lt;qty&gt; [@handle] [name]</code>",
    "  e.g. <code>/sale monster 2 @aarav Aarav</code>",
    "",
    "<b>Per-order courier cost</b>",
    "<code>/ship &lt;order#&gt; &lt;courier₹&gt;</code>",
    "  e.g. <code>/ship MC-00042 80</code>",
    "  Use this after you hand the parcel to the courier.",
    "",
    "<b>Expenses (bulk)</b>",
    "<code>/expense &lt;category&gt; &lt;amount&gt; [note]</code>",
    "  e.g. <code>/expense ads 500 Insta boost</code>",
    "  e.g. <code>/expense packaging 200 amazon boxes</code>",
    "  e.g. <code>/expense shipping 450 dec 2-8 batch</code>",
    "  Categories: ads · collab · restock · shipping · packaging · other",
    "",
    "<b>Reports</b>",
    "<code>/today</code>   — today's revenue + profit",
    "<code>/month</code>   — month-to-date P&amp;L",
    "<code>/stock</code>   — low-stock list (≤5)",
    "<code>/stock &lt;product&gt;</code>",
    "",
    "<b>Other</b>",
    "<code>/undo</code>   — delete the most recent cash sale (restores stock)",
    "<code>/help</code>",
    "",
    "<i>Short aliases: /s /e /t /m</i>",
  ].join("\n");
  await sendTelegramMessage(chatId, text);
}

async function cmdSale(chatId: number, args: string): Promise<void> {
  if (!args) {
    await sendTelegramMessage(
      chatId,
      "Usage: <code>/sale &lt;product&gt; &lt;qty&gt; [@handle] [name]</code>"
    );
    return;
  }
  /* Parse: first token = product fragment, second = qty.
   * Remaining tokens: @handle (optional, starts with @) + name (rest). */
  const tokens = args.split(/\s+/);
  if (tokens.length < 2) {
    await sendTelegramMessage(
      chatId,
      "Need at least <code>&lt;product&gt; &lt;qty&gt;</code>."
    );
    return;
  }
  const productQuery = tokens[0];
  const qty = Number(tokens[1]);
  if (!Number.isFinite(qty) || qty <= 0) {
    await sendTelegramMessage(chatId, `Bad quantity: ${esc(tokens[1])}`);
    return;
  }

  let instagram = "";
  const rest: string[] = [];
  for (const t of tokens.slice(2)) {
    if (t.startsWith("@") && !instagram) instagram = t.slice(1);
    else rest.push(t);
  }
  const customerName = rest.join(" ").trim() || (instagram ? `@${instagram}` : "");

  const { exact, candidates } = await findProductByQuery(productQuery);
  if (!exact) {
    if (candidates.length === 0) {
      await sendTelegramMessage(chatId, `No product matches "${esc(productQuery)}"`);
    } else {
      const list = candidates.map((c) => `· <code>${esc(c.slug)}</code> — ${esc(c.name)}`).join("\n");
      await sendTelegramMessage(
        chatId,
        `Multiple matches for "${esc(productQuery)}":\n${list}\n\nTry the slug.`
      );
    }
    return;
  }

  const result = await logCashSale({
    items: [{ slug: exact.slug, qty }],
    customerName,
    customerInstagram: instagram,
    chargeShipping: false,
  });

  const stockLeft = (await getStockBySlug(exact.slug)) ?? 0;
  const profitLine =
    result.profit < 0
      ? `<i>profit n/a — set a cost price for ${esc(exact.slug)}</i>`
      : `<b>profit: ${fmtInr(result.profit)}</b>`;

  const reply = [
    `✅ <b>${result.orderNumber}</b> · ${fmtInr(result.total)}`,
    `${esc(result.itemSummary)}${customerName ? ` · ${esc(customerName)}` : ""}`,
    profitLine,
    `stock left: ${stockLeft}`,
  ].join("\n");
  await sendTelegramMessage(chatId, reply);
}

async function cmdExpense(chatId: number, args: string): Promise<void> {
  if (!args) {
    await sendTelegramMessage(
      chatId,
      "Usage: <code>/expense &lt;category&gt; &lt;amount&gt; [note]</code>\nCategories: ads · collab · restock · shipping · packaging · other"
    );
    return;
  }
  const tokens = args.split(/\s+/);
  if (tokens.length < 2) {
    await sendTelegramMessage(
      chatId,
      "Need <code>&lt;category&gt; &lt;amount&gt;</code> at minimum."
    );
    return;
  }
  const category = resolveExpenseCategory(tokens[0]);
  if (!category) {
    await sendTelegramMessage(
      chatId,
      `Unknown category "${esc(tokens[0])}". Try: ads, collab, restock, shipping, packaging, other.`
    );
    return;
  }
  const amount = Number(tokens[1]);
  if (!Number.isFinite(amount) || amount < 0) {
    await sendTelegramMessage(chatId, `Bad amount: ${esc(tokens[1])}`);
    return;
  }
  const description = tokens.slice(2).join(" ").trim();

  const { id } = await logExpense({ category, amount, description });

  const reply = [
    `✅ Expense #${id}`,
    `${EXPENSE_CATEGORY_LABEL[category]} · −${fmtInr(amount)}`,
    description ? `<i>${esc(description)}</i>` : "",
  ]
    .filter(Boolean)
    .join("\n");
  await sendTelegramMessage(chatId, reply);
}

async function cmdToday(chatId: number): Promise<void> {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);
  const stats = await getStatsForRange(dayStart.toISOString(), dayEnd.toISOString());
  const reply = [
    `<b>Today · ${dayStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</b>`,
    `Orders: ${stats.orderCount} (online: ${stats.onlineOrderCount}, cash: ${stats.cashOrderCount})`,
    `Revenue: <b>${fmtInr(stats.revenue)}</b>`,
    `COGS: −${fmtInr(stats.cogs)}`,
    `Gateway fees: −${fmtInr(stats.gatewayFees)}`,
    `Expenses: −${fmtInr(stats.expensesTotal)}`,
    `<b>Net profit: ${fmtInr(stats.netProfit)}</b>`,
  ].join("\n");
  await sendTelegramMessage(chatId, reply);
}

async function cmdMonth(chatId: number): Promise<void> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const stats = await getStatsForRange(monthStart.toISOString(), nextMonth.toISOString());
  const reply = [
    `<b>${monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</b>`,
    `Orders: ${stats.orderCount} (online: ${stats.onlineOrderCount}, cash: ${stats.cashOrderCount})`,
    `Revenue: <b>${fmtInr(stats.revenue)}</b>`,
    `COGS: −${fmtInr(stats.cogs)}`,
    `Gateway fees: −${fmtInr(stats.gatewayFees)}`,
    `Per-order costs: −${fmtInr(stats.merchantCost)}`,
    `Expenses: −${fmtInr(stats.expensesTotal)}`,
    `<b>Net profit: ${fmtInr(stats.netProfit)}</b>`,
  ].join("\n");
  await sendTelegramMessage(chatId, reply);
}

async function cmdStock(chatId: number, args: string): Promise<void> {
  if (args.trim()) {
    const { exact, candidates } = await findProductByQuery(args.trim());
    if (!exact) {
      if (candidates.length === 0) {
        await sendTelegramMessage(chatId, `No product matches "${esc(args)}"`);
      } else {
        const list = candidates.map((c) => `· <code>${esc(c.slug)}</code>`).join("\n");
        await sendTelegramMessage(chatId, `Multiple matches:\n${list}`);
      }
      return;
    }
    const left = (await getStockBySlug(exact.slug)) ?? 0;
    await sendTelegramMessage(
      chatId,
      `<b>${esc(exact.name)}</b>\nstock: ${left}`
    );
    return;
  }
  const low = await getLowStock(5);
  if (low.length === 0) {
    await sendTelegramMessage(chatId, "All stock above 5. 🎉");
    return;
  }
  const list = low
    .map(
      (r) =>
        `${r.stock === 0 ? "🛑" : "⚠️"} <code>${esc(r.slug)}</code> · ${r.stock}`
    )
    .join("\n");
  await sendTelegramMessage(chatId, `<b>Low stock (≤5)</b>\n${list}`);
}

async function cmdShip(chatId: number, args: string): Promise<void> {
  if (!args) {
    await sendTelegramMessage(
      chatId,
      "Usage: <code>/ship &lt;order#&gt; &lt;courier₹&gt;</code>\n" +
        "e.g. <code>/ship MC-00042 80</code>\n" +
        "Logs the actual courier cost on that order. Subtracted from its profit."
    );
    return;
  }
  const tokens = args.split(/\s+/);
  if (tokens.length < 2) {
    await sendTelegramMessage(
      chatId,
      "Need <code>&lt;order#&gt; &lt;amount&gt;</code>."
    );
    return;
  }
  const orderRef = tokens[0];
  const amount = Number(tokens[1]);
  if (!Number.isFinite(amount) || amount < 0) {
    await sendTelegramMessage(chatId, `Bad amount: ${esc(tokens[1])}`);
    return;
  }
  const { orderNumber, previousCost } = await setOrderMerchantCost(orderRef, amount);
  const note =
    previousCost != null
      ? `(was ${fmtInr(previousCost)})`
      : "";
  await sendTelegramMessage(
    chatId,
    `✅ <b>${orderNumber}</b> courier cost: ${fmtInr(amount)} ${esc(note)}`
  );
}

async function cmdUndo(chatId: number): Promise<void> {
  const undone = await undoLastCashOrder();
  if (!undone) {
    await sendTelegramMessage(chatId, "No cash orders to undo.");
    return;
  }
  await sendTelegramMessage(
    chatId,
    `↩️ Undone <b>${undone.orderNumber}</b> · ${fmtInr(undone.total)}\nrestored: ${esc(undone.itemSummary)}`
  );
}

// Telegram pings the webhook with GET to test reachability.
export async function GET() {
  return NextResponse.json({ ok: true, service: "midnight-chhaya-finance-bot" });
}
