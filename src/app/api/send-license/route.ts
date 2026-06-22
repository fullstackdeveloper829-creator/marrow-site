/**
 * POST /api/send-license
 * Called as a manual retry if the user didn't receive their webhook email.
 * Retrieves the session, generates the license key, and sends a confirmation email.
 * Download links in the email go directly to GitHub releases — no key in URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/mailer";
import { generateLicenseKey, PAID_TIERS, type LicenseTier, type LicensePayload } from "@/lib/license";
import { GITHUB_REPO, FALLBACK_RELEASE } from "@/lib/constants";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
function computeExpiresAt(billing: string): number | null {
  const now = Date.now();
  if (billing === "lifetime") return null;
  if (billing === "launch")   return now + 90  * DAY_MS;
  if (billing === "monthly")  return now + 31  * DAY_MS;
  return now + 365 * DAY_MS;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = (body as { sessionId?: string }).sessionId;
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const licenseSecret = process.env.MARROW_LICENSE_SECRET;
  if (!licenseSecret) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "payment_intent"],
    });
  } catch (err) {
    return NextResponse.json({ error: `Stripe error: ${String(err)}` }, { status: 502 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  const customer      = session.customer      as Stripe.Customer      | null;
  const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
  const email =
    session.customer_details?.email ??
    customer?.email ??
    paymentIntent?.receipt_email ??
    session.customer_email;

  if (!email) return NextResponse.json({ error: "No email found on session" }, { status: 422 });

  const rawTier = session.metadata?.["tier"] ?? "COLLECTOR";
  const billing = session.metadata?.["billing"] ?? "launch";
  const tier: LicenseTier = PAID_TIERS.includes(rawTier as LicenseTier) ? (rawTier as LicenseTier) : "COLLECTOR";

  const payload: LicensePayload = {
    tier, email,
    orderId:   session.id,
    issuedAt:  Date.now(),
    expiresAt: computeExpiresAt(billing),
  };

  const licenseKey = generateLicenseKey(payload, licenseSecret);
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marrow-site.vercel.app";
  const ghBase     = `https://github.com/${GITHUB_REPO}/releases/download/${FALLBACK_RELEASE}`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>body{margin:0;padding:0;background:#050510;font-family:-apple-system,sans-serif;color:#f4f4f5}
.w{max-width:560px;margin:40px auto;padding:0 20px}
.card{background:#0f0f1a;border:1px solid #27272a;border-radius:12px;padding:40px}
.logo{font-size:20px;font-weight:800;color:#fff;margin-bottom:32px}
h1{font-size:24px;font-weight:700;margin:0 0 8px;color:#fff}
p{font-size:15px;line-height:1.6;color:#a1a1aa;margin:0 0 16px}
.key{background:#18181b;border:1px solid #3f3f46;border-radius:8px;padding:16px 20px;font-family:monospace;font-size:12px;color:#e4e4e7;word-break:break-all;margin:24px 0}
.label{font-size:11px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:.1em;margin:28px 0 12px}
.btn{display:block;background:rgba(79,70,229,.15);border:1px solid rgba(99,102,241,.35);border-radius:10px;padding:14px 18px;text-decoration:none;color:#d4d4d8;font-size:14px;font-weight:600;margin-bottom:8px}
.footer{margin-top:32px;font-size:13px;color:#52525b;text-align:center}
</style></head><body>
<div class="w"><div class="card">
<div class="logo">Marrow Library</div>
<h1>You're all set!</h1>
<p>Thanks for your purchase, ${email}. Your license key is below — or just enter your email in the app to activate.</p>
<div class="label">Your License Key</div>
<div class="key">${licenseKey}</div>
<div class="label">Download</div>
<a class="btn" href="${ghBase}/MarrowLibrary-${FALLBACK_RELEASE}-macos-universal.dmg">🍎 Download for macOS (.dmg)</a>
<a class="btn" href="${ghBase}/MarrowLibrary-${FALLBACK_RELEASE}-windows-setup.exe">🪟 Download for Windows (.exe)</a>
<a class="btn" href="${ghBase}/MarrowScanner-${FALLBACK_RELEASE}-android.apk">🤖 Download Android Scanner (.apk)</a>
<div style="margin-top:24px;background:#0a0a14;border:1px solid #27272a;border-radius:8px;padding:20px">
<p style="font-size:11px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">Easiest activation</p>
<ol style="margin:0;padding-left:20px;color:#a1a1aa;font-size:14px;line-height:1.8">
<li>Open Marrow Library → click the license badge (top-right)</li>
<li>Enter <strong style="color:#c7d2fe;">${email}</strong> → click Activate Pro</li>
</ol>
</div>
</div>
<div class="footer">Marrow Library · Questions? Reply to this email.<br/>© 2026 Marrow Library · <a href="${siteUrl}/privacy" style="color:#52525b;">Privacy</a></div>
</div></body></html>`;

  try {
    await sendEmail({ to: email, subject: "Your Marrow Library License Key & Download Links", html });
    console.log(`[send-license] Sent to ${email} for session ${sessionId}`);
    return NextResponse.json({ ok: true, email });
  } catch (err) {
    console.error(`[send-license] Failed:`, err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
