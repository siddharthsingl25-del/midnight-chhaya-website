/**
 * GET /api/admin/finance
 *
 * Computes the P&L numbers for the admin dashboard in one shot — every
 * order with its per-line COGS resolved against the live product
 * cost_price, plus expenses summed by category. The client only has to
 * render the result.
 *
 * Profit per order = total − shipping(passed-through) − COGS − merchant_cost
 *                    − razorpay_fee(2% online, 0 cash)
 *
 * Shipping is treated as pass-through revenue: the customer pays the
 * courier rate, the merchant pays the courier (logged separately on
 * `merchant_cost`). Including shipping in revenue but not subtracting
 * the actual courier cost would inflate profit, so we exclude both by
 * subtracting shipping from total.
 *
 * Razorpay's standard rate is ~2% on online payments. Cash sales have
 * no gateway fee.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/types";

const RAZORPAY_FEE_RATE = 0.02; // 2% for online payments
const ONLINE_PASS_THROUGH_PACKAGING = 0; // already covered via expenses table

type OrderRow = {
  id: number;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_instagram: string;
  payment_method: "online" | "cash";
  items: Array<{
    slug: string;
    name: string;
    qty: number;
    chainId?: string | null;
    chainName?: string | null;
    unitPrice: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  merchant_cost: number | null;
  status: string;
};

type ProductCostRow = { slug: string; cost_price: number | null };

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? "200")));

  const sb = supabaseAdmin();

  const [ordersRes, productsRes, chainsRes, expensesRes] = await Promise.all([
    sb
      .from("orders")
      .select(
        "id, order_number, created_at, customer_name, customer_instagram, payment_method, items, subtotal, shipping, total, merchant_cost, status"
      )
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(limit),
    sb.from("products").select("slug, cost_price"),
    sb.from("chain_options").select("id, cost_price"),
    sb
      .from("expenses")
      .select("*")
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(500),
  ]);

  if (ordersRes.error)
    return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  if (productsRes.error)
    return NextResponse.json({ error: productsRes.error.message }, { status: 500 });
  if (chainsRes.error)
    return NextResponse.json({ error: chainsRes.error.message }, { status: 500 });
  if (expensesRes.error)
    return NextResponse.json({ error: expensesRes.error.message }, { status: 500 });

  const costBySlug = new Map<string, number | null>();
  for (const p of (productsRes.data ?? []) as ProductCostRow[]) {
    costBySlug.set(p.slug, p.cost_price);
  }
  const costByChain = new Map<string, number | null>();
  for (const c of (chainsRes.data ?? []) as Array<{ id: string; cost_price: number | null }>) {
    costByChain.set(c.id, c.cost_price);
  }

  // Per-order P&L
  const orders = ((ordersRes.data ?? []) as OrderRow[]).map((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    let cogs = 0;
    let hasMissingCost = false;
    for (const it of items) {
      const c = costBySlug.get(it.slug);
      if (c == null) {
        hasMissingCost = true;
      } else {
        cogs += c * (it.qty ?? 0);
      }
      // Chain on this line carries its own cost. If the chain has no
      // cost_price set yet, silently skip — flagging it as 'missing' on
      // every chain order would be too noisy until the merchant fills
      // them all in.
      if (it.chainId) {
        const cc = costByChain.get(it.chainId);
        if (cc != null) cogs += cc * (it.qty ?? 0);
      }
    }
    const merchantCost = o.merchant_cost ?? 0;
    const gatewayFee =
      o.payment_method === "online" ? Math.round(o.total * RAZORPAY_FEE_RATE) : 0;
    // Shipping the customer paid is real revenue (covers the courier
    // bill, or part of it). Actual courier cost is logged separately
    // as merchant_cost on the order (via /ship) or as a 'shipping'
    // expense line — either subtracts here.
    const netRevenue = o.total - gatewayFee - ONLINE_PASS_THROUGH_PACKAGING;
    const profit = netRevenue - cogs - merchantCost;
    return {
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      customerName: o.customer_name,
      customerInstagram: o.customer_instagram,
      paymentMethod: o.payment_method,
      items,
      subtotal: o.subtotal,
      shipping: o.shipping,
      total: o.total,
      merchantCost,
      gatewayFee,
      cogs,
      netRevenue,
      profit,
      hasMissingCost,
      status: o.status,
    };
  });

  // Month aggregates (current calendar month, IST)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthOrders = orders.filter(
    (o) => new Date(o.createdAt).getTime() >= monthStart
  );
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
  const monthCogs = monthOrders.reduce((s, o) => s + o.cogs, 0);
  const monthGatewayFees = monthOrders.reduce((s, o) => s + o.gatewayFee, 0);
  const monthMerchantCost = monthOrders.reduce((s, o) => s + o.merchantCost, 0);
  const monthGrossProfit = monthOrders.reduce((s, o) => s + o.profit, 0);

  // All-time aggregates
  const allRevenue = orders.reduce((s, o) => s + o.total, 0);
  const allCogs = orders.reduce((s, o) => s + o.cogs, 0);
  const allGrossProfit = orders.reduce((s, o) => s + o.profit, 0);

  // Expenses
  const expenses = (expensesRes.data ?? []).map((e) => ({
    id: e.id as number,
    category: e.category as ExpenseCategory,
    amount: e.amount as number,
    description: (e.description as string) ?? "",
    occurredAt: e.occurred_at as string,
    createdAt: e.created_at as string,
  }));

  const monthExpensesByCategory: Record<ExpenseCategory, number> = {
    advertising: 0,
    collab: 0,
    restock: 0,
    shipping: 0,
    packaging: 0,
    other: 0,
  };
  let monthExpensesTotal = 0;
  for (const e of expenses) {
    const occ = new Date(e.occurredAt).getTime();
    if (occ >= monthStart && EXPENSE_CATEGORIES.includes(e.category)) {
      monthExpensesByCategory[e.category] += e.amount;
      monthExpensesTotal += e.amount;
    }
  }
  const allExpensesTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return NextResponse.json({
    orders,
    expenses,
    month: {
      revenue: monthRevenue,
      cogs: monthCogs,
      gatewayFees: monthGatewayFees,
      merchantCost: monthMerchantCost,
      grossProfit: monthGrossProfit,
      expensesTotal: monthExpensesTotal,
      expensesByCategory: monthExpensesByCategory,
      netProfit: monthGrossProfit - monthExpensesTotal,
      orderCount: monthOrders.length,
    },
    allTime: {
      revenue: allRevenue,
      cogs: allCogs,
      grossProfit: allGrossProfit,
      expensesTotal: allExpensesTotal,
      netProfit: allGrossProfit - allExpensesTotal,
      orderCount: orders.length,
    },
  });
}
