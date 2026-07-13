import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Marrow Library privacy policy — local-first, no cloud storage, no tracking. Your collection data never leaves your device.",
  alternates: { canonical: "https://marrow-site.vercel.app/privacy" },
  openGraph: {
    type: "website",
    title: "Privacy Policy | Marrow Library",
    description: "Local-first, no cloud storage, no tracking. Your collection data never leaves your device.",
    url: "https://marrow-site.vercel.app/privacy",
    images: [{ url: "https://marrow-site.vercel.app/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

const EMAIL = "fullstackdeveloper829@gmail.com";
const LAST_UPDATED = "2 June 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-20" style={{ background: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm hover:text-[#1C1812] transition-colors mb-10 inline-block" style={{ color: "var(--text-2)" }}>
          ← Back to home
        </Link>

        <h1 className="text-4xl font-black text-[#1C1812] mb-2">Privacy Policy</h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>Last updated: {LAST_UPDATED}</p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-12"
          style={{ background: "rgba(63,107,79,0.08)", border: "1px solid rgba(63,107,79,0.3)", color: "#3F6B4F" }}
        >
          ✓ Local-first — your collection data never leaves your device
        </div>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">1. Overview</h2>
            <p>Marrow Library is designed with privacy by default. Your collection data — every item you catalog, every note you write, every valuation you track — is stored locally on your device. We cannot access it. We do not want it.</p>
            <p className="mt-3">This policy describes the limited data we do collect and how we use it.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">2. Data We Collect</h2>

            <h3 className="font-semibold text-[#1C1812] mt-4 mb-2">2a. Purchase data (via Stripe)</h3>
            <p>When you purchase a paid plan, Stripe processes your payment. To ensure reliable license delivery across all checkout types (guest, saved account, subscription, and one-time payment), we retrieve your <strong className="text-[#1C1812]">full Stripe session profile</strong> upon purchase completion. This includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your email address (from <code className="text-xs bg-[#ECE4D2] px-1 rounded">customer_details</code>, saved Customer record, payment receipt, or session field — whichever is available)</li>
              <li>Order / session ID and plan type</li>
              <li>Saved Customer profile (name and email) if you have a Stripe account</li>
              <li>Payment intent receipt email, if set by your card issuer</li>
            </ul>
            <p className="mt-3">We retrieve this comprehensive profile <strong className="text-[#1C1812]">solely to extract your email address</strong> for license key delivery. No other fields from the profile are stored, logged, or processed beyond what is needed to dispatch your confirmation email.</p>
            <p className="mt-3">We do not receive or store your credit card number, billing address, or any other financial information. All payment data is handled by Stripe under their <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1C1812]">Privacy Policy</a>.</p>

            <h3 className="font-semibold text-[#1C1812] mt-4 mb-2">2b. License key data</h3>
            <p>Your license key contains your email address, plan type, and purchase date — encoded and signed cryptographically. This is stored only on your device after activation.</p>

            <h3 className="font-semibold text-[#1C1812] mt-4 mb-2">2c. Metadata lookups</h3>
            <p>When you scan a barcode, the App queries third-party APIs (Open Library, TMDB, Discogs, eBay) to fetch metadata. These requests include the barcode or ISBN — no personal information is sent.</p>

            <h3 className="font-semibold text-[#1C1812] mt-4 mb-2">2d. Email delivery transparency</h3>
            <p>To guarantee license key delivery regardless of how you checked out, our system retrieves the most complete version of your Stripe session record available. This is a read-only API call made immediately after purchase. The data accessed is:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-[#1C1812]">Purpose:</strong> Resolve your email address for license delivery</li>
              <li><strong className="text-[#1C1812]">Retention:</strong> Not stored — used transiently in memory during request processing only</li>
              <li><strong className="text-[#1C1812]">Scope:</strong> Limited to the session you initiated; we do not access any other Stripe records</li>
              <li><strong className="text-[#1C1812]">Security:</strong> All Stripe API calls are authenticated with a server-side secret key never exposed to the client</li>
            </ul>
            <p className="mt-3">Data fields accessed but not required for email delivery (such as expanded customer name fields) are never written to any database, log, or third-party service.</p>

            <h3 className="font-semibold text-[#1C1812] mt-4 mb-2">2e. What we do NOT collect</h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your collection data (books, records, games, etc.)</li>
              <li>Analytics or usage tracking</li>
              <li>Crash reports (no telemetry)</li>
              <li>Location data</li>
              <li>Device identifiers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">3. How We Use Your Data</h2>
            <p>We use your email address solely to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Send your license key after purchase</li>
              <li>Respond to support requests you initiate</li>
            </ul>
            <p className="mt-3">We do not send marketing emails. We do not sell your data. We do not share your data with any third party except as required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">4. Data Retention</h2>
            <p>We retain your email address and order record for accounting purposes for up to 7 years as required by law. You may request deletion of your data by emailing us — we will delete what we can outside of legal obligations.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">5. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-[#1C1812]">Stripe</strong> — payment processing. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1C1812]">Privacy Policy</a></li>
              <li><strong className="text-[#1C1812]">Gmail (Google)</strong> — transactional email delivery via Gmail SMTP. Your email address is transmitted to Google&apos;s mail servers solely to deliver your license key. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1C1812]">Google Privacy Policy</a></li>
              <li><strong className="text-[#1C1812]">eBay</strong> — market valuation data. <a href="https://www.ebay.com/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1C1812]">Privacy Policy</a></li>
              <li><strong className="text-[#1C1812]">Vercel</strong> — website hosting. Standard access logs (IP, browser) are retained per Vercel&apos;s policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">6. Your Rights</h2>
            <p>Depending on your location, you may have rights under GDPR, CCPA, or similar laws to access, correct, or delete your personal data. To exercise any of these rights, contact us at <a href={`mailto:${EMAIL}`} className="underline hover:text-[#1C1812]">{EMAIL}</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">7. Children&apos;s Privacy</h2>
            <p>Marrow Library is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, contact us and we will delete it.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will post the updated policy on this page with a new "Last updated" date. Continued use of the App after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">9. Contact</h2>
            <p>Privacy questions? Email us at <a href={`mailto:${EMAIL}`} className="underline hover:text-[#1C1812]">{EMAIL}</a></p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t flex gap-6 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
          <Link href="/terms" className="hover:text-[#57503F] transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-[#57503F] transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}
