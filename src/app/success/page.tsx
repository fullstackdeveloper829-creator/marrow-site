import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { generateLicenseKey, PAID_TIERS, type LicenseTier, type LicensePayload } from "@/lib/license";
import type Stripe from "stripe";

interface SuccessPageProps {
  searchParams: { session_id?: string; key?: string };
}

const PLATFORMS = [
  { key: "macos",   icon: "🍎", label: "macOS",           badge: ".dmg"    },
  { key: "windows", icon: "🪟", label: "Windows",          badge: ".exe"    },
  { key: "android", icon: "🤖", label: "Android Scanner",  badge: ".apk"    },
  { key: "ios",     icon: "📱", label: "iOS Simulator",    badge: ".tar.gz" },
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
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["customer", "payment_intent"],
      });

      const customer      = session.customer      as Stripe.Customer      | null;
      const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;

      const tier    = session.metadata?.["tier"]    ?? "COLLECTOR";
      const billing = session.metadata?.["billing"] ?? "launch";

      if (tier === "CURATOR")        tierLabel = "Curator";
      else if (tier === "COLLECTOR") tierLabel = "Collector";

      customerEmail =
        session.customer_details?.email ??
        customer?.email ??
        paymentIntent?.receipt_email ??
        session.customer_email ??
        null;

      // Generate license key for on-page display only.
      // The purchase confirmation email is sent exclusively by the Stripe webhook
      // (/api/webhook) to avoid duplicate sends.
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
            Your purchase confirmation and download links have been sent to your email.
            Check your inbox (and spam folder).
          </p>
        </div>

        {/* License key display — copy & paste to activate in-app */}
        {licenseKey && (
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#0a0a14", borderColor: "#27272a" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#52525b" }}
            >
              Your License Key
            </p>
            <code
              className="block text-xs break-all p-4 rounded-xl select-all"
              style={{ background: "#0f0f1a", border: "1px solid #3f3f46", color: "#e4e4e7", fontFamily: "monospace" }}
            >
              {licenseKey}
            </code>
            <p className="text-xs mt-2" style={{ color: "#52525b" }}>
              Click the code above to select all, then copy it.
            </p>
          </div>
        )}

        {/* Premium download card — POST forms keep the license key out of the URL */}
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
                ? "Click a platform below to download. Your license key is submitted securely."
                : "Use the download links from your confirmation email, or download below and activate via email in the app."}
            </p>
          </div>

          <div className="px-8 py-6 space-y-3">
            {PLATFORMS.map((p) => (
              licenseKey ? (
                <form key={p.key} method="POST" action="/api/download/premium">
                  <input type="hidden" name="key"      value={licenseKey} />
                  <input type="hidden" name="platform" value={p.key} />
                  <button
                    type="submit"
                    className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-85 cursor-pointer"
                    style={{
                      background: "rgba(79,70,229,0.15)",
                      border: "1px solid rgba(99,102,241,0.4)",
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
                  </button>
                </form>
              ) : (
                <div
                  key={p.key}
                  className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold opacity-50"
                  style={{ background: "#18181b", border: "1px solid #27272a", color: "#d4d4d8" }}
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
                </div>
              )
            ))}
          </div>

          {!licenseKey && (
            <div className="px-8 pb-6">
              <p className="text-xs text-center" style={{ color: "#52525b" }}>
                💡 Download links with your key are in your confirmation email.
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
            Activate via email (easiest)
          </p>
          <ol className="space-y-3 text-sm" style={{ color: "#a1a1aa" }}>
            {[
              "Download and open Marrow Library on your Mac or PC",
              <>Click the <strong className="text-white">license badge</strong> in the top-right corner</>,
              <>Enter <strong className="text-white">{customerEmail ?? "your purchase email"}</strong> and click <strong className="text-white">Activate Pro</strong></>,
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
