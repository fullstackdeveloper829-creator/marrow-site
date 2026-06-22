/**
 * Diagnostic script — run with: node scripts/check-email.mjs
 *
 * 1. Lists Stripe webhook endpoints and checks for the production URL
 * 2. Creates the webhook if it's missing
 * 3. Sends a Resend test email to verify delivery works
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "../.env.local");
const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const STRIPE_KEY     = env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
const RESEND_KEY     = env.RESEND_API_KEY;
const PROD_URL       = "https://marrow-site.vercel.app/api/webhook";
const EVENTS         = ["checkout.session.completed"];

if (!STRIPE_KEY || !RESEND_KEY) {
  console.error("❌  Missing STRIPE_SECRET_KEY or RESEND_API_KEY in .env.local");
  process.exit(1);
}

// ── Stripe helpers ────────────────────────────────────────────────────────────
async function stripeGet(path) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_KEY}` },
  });
  return r.json();
}

async function stripePost(path, params) {
  const body = new URLSearchParams(params);
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  return r.json();
}

// ── 1. List webhook endpoints ─────────────────────────────────────────────────
console.log("\n── Stripe webhooks ──────────────────────────────────────────");
const { data: hooks } = await stripeGet("/webhook_endpoints?limit=20");

if (!hooks?.length) {
  console.log("   No webhook endpoints found.");
} else {
  for (const h of hooks) {
    const match = h.url === PROD_URL ? " ✓ MATCH" : "";
    console.log(`   ${h.status.padEnd(8)} ${h.url}${match}`);
  }
}

const alreadyRegistered = hooks?.some(h => h.url === PROD_URL && h.status === "enabled");

// ── 2. Register if missing ────────────────────────────────────────────────────
if (!alreadyRegistered) {
  console.log(`\n   ⚠  Production endpoint not found. Creating...`);
  const params = { url: PROD_URL };
  EVENTS.forEach((e, i) => { params[`enabled_events[${i}]`] = e; });
  const created = await stripePost("/webhook_endpoints", params);
  if (created.id) {
    console.log(`   ✅ Created: ${created.id}`);
    console.log(`   🔑 Webhook signing secret: ${created.secret.slice(0, 12)}...(copy to STRIPE_WEBHOOK_SECRET in Vercel)`);
    console.log(`\n   ⚠  ACTION REQUIRED: Update STRIPE_WEBHOOK_SECRET in Vercel to:`);
    console.log(`      ${created.secret}`);
    console.log(`      https://vercel.com/marrow-library/marrow-site/settings/environment-variables`);
  } else {
    console.error("   ❌ Failed to create webhook:", JSON.stringify(created));
  }
} else {
  console.log(`\n   ✅ Production webhook already registered and enabled.`);

  // Check if the secret matches
  const stored = WEBHOOK_SECRET;
  const hook   = hooks.find(h => h.url === PROD_URL);
  console.log(`   Endpoint ID: ${hook?.id}`);
  console.log(`   Stored secret prefix: ${stored?.slice(0, 12)}...`);
}

// ── 3. Test Resend delivery ───────────────────────────────────────────────────
console.log("\n── Resend email test ────────────────────────────────────────");
const testTo = "fullstackdeveloper829@gmail.com";
const resendRes = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${RESEND_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "Marrow Library <onboarding@resend.dev>",
    to:   testTo,
    subject: "Marrow Library — Email delivery test",
    html: "<p>This is a delivery test from the Marrow Library license system. If you received this, email sending is working correctly.</p>",
  }),
});

const resendData = await resendRes.json();
if (resendRes.ok && resendData.id) {
  console.log(`   ✅ Test email sent to ${testTo} — Resend ID: ${resendData.id}`);
} else {
  console.error(`   ❌ Resend failed (${resendRes.status}):`, JSON.stringify(resendData));
}

console.log("\n─────────────────────────────────────────────────────────────\n");
