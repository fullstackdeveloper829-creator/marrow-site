import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/mailer";
import { generateLicenseKey, PAID_TIERS, type LicenseTier, type LicensePayload } from "@/lib/license";
import type Stripe from "stripe";

interface SuccessPageProps {
  searchParams: { session_id?: string; key?: string };
}

const PLATFORMS = [
  { key: "macos",   icon: "🍎", label: "macOS",          badge: ".dmg" },
  { key: "windows", icon: "🪟", label: "Windows",         badge: ".exe" },
  { key: "android", icon: "🤖", label: "Android Scanner", badge: ".apk" },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
function computeExpiresAt(billing: string): number | null {
  const now = Date.now();
  if (billing === "lifetime") return null;
  if (billing === "launch")   return now + 90  * DAY_MS;
  if (billing === "monthly")  return now + 31  * DAY_MS;
  return now + 365 * DAY_MS;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams.session_id;

  let tierLabel      = "Premium";
  let customerEmail: string | null = null;
  let licenseKey: string | null = searchParams.key ?? null;

  if (sessionId) {
    try {
      // Retrieve full session — expand customer + payment_intent for email resolution
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["customer", "payment_intent"],
      });

      const customer      = session.customer      as Stripe.Customer      | null;
      const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;

      const tier    = session.metadata?.["tier"]    ?? "COLLECTOR";
      const billing = session.metadata?.["billing"] ?? "launch";

      if (tier === "CURATOR")   tierLabel = "Curator";
      else if (tier === "COLLECTOR") tierLabel = "Collector";

      // Resolve email from every available source
      customerEmail =
        session.customer_details?.email ??
        customer?.email ??
        paymentIntent?.receipt_email ??
        session.customer_email ??
        null;

      // Generate license key and send email if payment is confirmed
      if (customerEmail && session.payment_status === "paid") {
        const licenseSecret = process.env.MARROW_LICENSE_SECRET;
        if (licenseSecret) {
          const resolvedTier: LicenseTier = PAID_TIERS.includes(tier as LicenseTier)
            ? (tier as LicenseTier)
            : "COLLECTOR";

          const payload: LicensePayload = {
            tier:      resolvedTier,
            email:     customerEmail,
            orderId:   session.id,
            issuedAt:  Date.now(),
            expiresAt: computeExpiresAt(billing),
          };

          licenseKey = generateLicenseKey(payload, licenseSecret);
          const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marrow-site.vercel.app";
          const encodedKey = encodeURIComponent(licenseKey);
          const dlBase     = `${siteUrl}/api/download/premium?key=${encodedKey}&platform=`;

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
<p>Thanks for your purchase, ${customerEmail}. Your license key and download links are below.</p>
<div class="label">Your License Key</div>
<div class="key">${licenseKey}</div>
<div class="label">Download</div>
<a class="btn" href="${dlBase}macos">🍎 Download for macOS (.dmg)</a>
<a class="btn" href="${dlBase}windows">🪟 Download for Windows (.exe)</a>
<a class="btn" href="${dlBase}android">🤖 Download Android Scanner (.apk)</a>
<div style="margin-top:24px;background:#0a0a14;border:1px solid #27272a;border-radius:8px;padding:20px">
<p style="font-size:11px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">Activate</p>
<ol style="margin:0;padding-left:20px;color:#a1a1aa;font-size:14px;line-height:1.8">
<li>Open Marrow Library → Settings → License</li>
<li>Paste your key → click Activate</li>
</ol>
</div>
</div>
<div class="footer">Marrow Library · Questions? Reply to this email.<br/>© 2026 Marrow Library.</div>
</div></body></html>`;

          // Fire email — awaited so it completes before page renders
          try {
            await sendEmail({
              to:      customerEmail,
              subject: "Your Marrow Library License Key & Download Links",
              html,
            });
            console.log(`[success] License email sent to ${customerEmail}`);
          } catch (emailErr) {
            console.error(`[success] Email failed:`, emailErr);
          }
        }
      }
    } catch (err) {
      console.error("[success] Session retrieval failed:", err);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-20"
      style={{
        background: "#050510",
        backgroundImage: `
          linear-gradient(rgba(79,70,229,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(79,70,229,0.05) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      <div className="max-w-xl w-full space-y-6">

        {/* Confirmation card */}
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: "#0f0f1a", borderColor: "#27272a" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-6"
            style={{ background: "rgba(99,102,241,0.15)" }}
          >
            🎉
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Order Confirmed!</h1>
          {customerEmail && (
            <p className="text-sm mb-4" style={{ color: "#71717a" }}>
              Receipt sent to <span style={{ color: "#a1a1aa" }}>{customerEmail}</span>
            </p>
          )}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <span className="text-xs font-bold" style={{ color: "#a5b4fc" }}>★ {tierLabel} Tier Unlocked</span>
          </div>
          <p style={{ color: "#a1a1aa", lineHeight: "1.7", fontSize: "0.875rem" }}>
            Your license key and personal download links have been sent to your email.
            Check your inbox (and spam folder).
          </p>
        </div>

        {/* Premium download card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0d0d1f 0%, #0f0a1e 100%)",
            borderColor: "#3730a3",
            boxShadow: "0 0 40px rgba(99,102,241,0.1)",
          }}
        >
          <div className="px-8 py-6 border-b" style={{ borderColor: "#1f1f35" }}>
            <h2 className="text-lg font-bold text-white mb-1">
              Download Your Premium Version
            </h2>
            <p className="text-sm" style={{ color: "#71717a" }}>
              {licenseKey
                ? "Your license key is pre-filled in each link below."
                : "Paste your license key from the email into the link to unlock the download."}
            </p>
          </div>

          <div className="px-8 py-6 space-y-3">
            {PLATFORMS.map((p) => {
              const href = licenseKey
                ? `/api/download/premium?key=${encodeURIComponent(licenseKey)}&platform=${p.key}`
                : `/api/download/premium?platform=${p.key}&key=PASTE_YOUR_LICENSE_KEY`;

              return (
                <a
                  key={p.key}
                  href={href}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
                  style={{
                    background: licenseKey ? "rgba(79,70,229,0.15)" : "#18181b",
                    border: `1px solid ${licenseKey ? "rgba(99,102,241,0.4)" : "#27272a"}`,
                    color: "#d4d4d8",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span>Download for {p.label}</span>
                  </span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: "rgba(0,0,0,0.3)", color: "#71717a" }}
                  >
                    {p.badge}
                  </span>
                </a>
              );
            })}
          </div>

          {!licenseKey && (
            <div className="px-8 pb-6">
              <p className="text-xs text-center" style={{ color: "#52525b" }}>
                💡 Replace <code style={{ color: "#71717a" }}>PASTE_YOUR_LICENSE_KEY</code> in the URL with
                your actual key, or use the link from your email which has it pre-filled.
              </p>
            </div>
          )}
        </div>

        {/* Activation instructions */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "#0a0a14", borderColor: "#27272a" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#52525b" }}
          >
            Activate your license in the app
          </p>
          <ol className="space-y-3 text-sm" style={{ color: "#a1a1aa" }}>
            {[
              "Download and open Marrow Library on your Mac or PC",
              <>Navigate to <strong className="text-white">Settings → License</strong></>,
              <>Paste your license key and click <strong className="text-white">Activate</strong></>,
              "Your Premium features unlock immediately",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                  style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Get started in 3 steps */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "#0a0a14", borderColor: "#27272a" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#52525b" }}>
            Get started in 3 steps
          </p>
          <ol className="space-y-4 text-sm" style={{ color: "#a1a1aa" }}>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>1</span>
              <span>
                <strong className="text-white">Download and open Marrow Library</strong> on your Mac or PC —{" "}
                <Link href="/download" className="underline" style={{ color: "#818cf8" }}>download page →</Link>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>2</span>
              <span>
                Go to <strong className="text-white">Settings → License</strong>, paste your license key, and click <strong className="text-white">Activate</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>3</span>
              <span>
                Install <strong className="text-white">Marrow Scanner</strong> on your phone for barcode scanning —{" "}
                <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer"
                  className="underline" style={{ color: "#818cf8" }}>Android</a>{" "}·{" "}
                <a href="mailto:support@marrowlibrary.app?subject=iOS%20Scanner%20Early%20Access" className="underline" style={{ color: "#818cf8" }}>iOS waitlist</a>
              </span>
            </li>
          </ol>
        </div>

        {/* Support */}
        <div className="rounded-2xl border p-5 text-center" style={{ background: "rgba(99,102,241,0.04)", borderColor: "rgba(99,102,241,0.15)" }}>
          <p className="text-sm" style={{ color: "#71717a" }}>
            Questions or issues?{" "}
            <a href="mailto:support@marrowlibrary.app"
              className="font-semibold hover:text-indigo-400 transition-colors"
              style={{ color: "#818cf8" }}>
              support@marrowlibrary.app
            </a>{" "}
            · We reply within 24 hours.
          </p>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-center gap-6 text-sm" style={{ color: "#52525b" }}>
          <Link href="/" className="hover:text-zinc-400 transition-colors">← Home</Link>
          <Link href="/download" className="hover:text-zinc-400 transition-colors">Download page</Link>
          <Link href="/#pricing" className="hover:text-zinc-400 transition-colors">Pricing</Link>
        </div>

      </div>
    </main>
  );
}
