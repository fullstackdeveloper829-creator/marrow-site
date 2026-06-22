/**
 * POST /api/auth/verify-email
 *
 * Called by the Marrow Library desktop app when the user enters their
 * purchase email to activate Pro. Looks up the email in Stripe, and if
 * a completed payment is found, issues a signed session token the app
 * stores locally and verifies on every launch.
 *
 * Body:   { email: string }
 * 200:    { token: string }
 * 404:    { error: string }  — no purchase found
 * 400/429/500: error strings
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { signSession } from "@/lib/license";

export const dynamic = "force-dynamic";

// ── In-process rate limit: 5 attempts per email per 15 min ───────────────────
// NOTE: This map resets on every server restart/deploy. For a persistent limit,
// replace with a database-backed counter (e.g. AppSetting or Redis/KV).
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RL_MAX = 5;
const RL_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false; // not limited
  }
  if (entry.count >= RL_MAX) return true; // limited
  entry.count++;
  return false;
}

// ── Stripe helpers ────────────────────────────────────────────────────────────

/**
 * Returns the unix-ms timestamp of the earliest completed Stripe checkout
 * for this email, or null if no purchase exists.
 *
 * Strategy (no Search API required):
 *   1. List Stripe customers whose email matches.
 *   2. For each customer, list their checkout sessions and find a paid one.
 *   3. Also scan the most recent 100 checkout sessions for a guest purchase
 *      (checkout without a saved customer) where customer_details.email matches.
 */
async function findPurchaseTimestamp(email: string): Promise<number | null> {
  // ── 1. Saved customers ────────────────────────────────────────────────────
  try {
    const customers = await stripe.customers.list({ email, limit: 5 });
    for (const customer of customers.data) {
      const sessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 25,
      });
      const paid = sessions.data.find(
        s =>
          s.status === "complete" &&
          (s.payment_status === "paid" || s.payment_status === "no_payment_required")
      );
      if (paid) return paid.created * 1000;
    }
  } catch (err) {
    console.error("[verify-email] Stripe customer lookup failed:", err);
  }

  // ── 2. Guest checkouts (no saved customer) ────────────────────────────────
  // Stripe doesn't support filtering sessions by guest email without Search,
  // so we scan the most-recent sessions and compare customer_details.email.
  // Limit to 100 which covers typical low-volume stores.
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const paid = sessions.data.find(
      s =>
        s.status === "complete" &&
        (s.payment_status === "paid" || s.payment_status === "no_payment_required") &&
        s.customer_details?.email?.toLowerCase() === email
    );
    if (paid) return paid.created * 1000;
  } catch (err) {
    console.error("[verify-email] Stripe session scan failed:", err);
  }

  return null;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Parse body
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const raw = (body as { email?: string }).email;
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!email || !email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  // Rate limit by email
  if (checkRateLimit(email)) {
    return NextResponse.json(
      { error: "Too many activation attempts. Please wait 15 minutes and try again." },
      { status: 429 }
    );
  }

  // Guard: secret must be set
  const secret = process.env.MARROW_LICENSE_SECRET;
  if (!secret) {
    console.error("[verify-email] MARROW_LICENSE_SECRET is not configured");
    return NextResponse.json({ error: "Server configuration error. Please contact support." }, { status: 500 });
  }

  // Look up purchase in Stripe
  const purchasedAt = await findPurchaseTimestamp(email);
  if (purchasedAt === null) {
    return NextResponse.json(
      {
        error:
          "No completed purchase found for this email address. " +
          "Please use the email you purchased with. " +
          "If you just purchased, wait a few minutes and try again.",
      },
      { status: 404 }
    );
  }

  // Issue signed session token
  const token = signSession({ email, purchasedAt, iat: Date.now() }, secret);

  console.log(`[verify-email] Issued session token for ${email} (purchased ${new Date(purchasedAt).toISOString()})`);
  return NextResponse.json({ token });
}
