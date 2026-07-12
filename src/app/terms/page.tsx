import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Marrow Library. One-time purchase, no subscription, 14-day refund policy. Local-first collection cataloging app.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://marrow-site.vercel.app/terms" },
  openGraph: {
    type: "website",
    title: "Terms of Service | Marrow Library",
    description: "One-time purchase, no subscription, 14-day refund policy. Local-first collection cataloging app.",
    url: "https://marrow-site.vercel.app/terms",
    images: [{ url: "https://marrow-site.vercel.app/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};
const EMAIL = "fullstackdeveloper829@gmail.com";
const LAST_UPDATED = "30 May 2025";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-20" style={{ background: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm hover:text-[#1C1812] transition-colors mb-10 inline-block" style={{ color: "var(--text-2)" }}>
          ← Back to home
        </Link>

        <h1 className="text-4xl font-black text-[#1C1812] mb-2">Terms of Service</h1>
        <p className="text-sm mb-12" style={{ color: "var(--text-3)" }}>Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">1. Acceptance of Terms</h2>
            <p>By downloading, installing, or using Marrow Library ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">2. Description of Service</h2>
            <p>Marrow Library is a local-first desktop and mobile application for cataloging physical collections including books, vinyl records, video games, movies, and other media. The App is available as a free tier and as paid subscription or one-time purchase plans.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">3. License</h2>
            <p>Upon purchase of a paid plan, we grant you a personal, non-exclusive, non-transferable license to use the App on your devices. Free tier users receive the same license subject to the feature limitations described on our pricing page.</p>
            <p className="mt-3">You may not: copy, modify, distribute, sell, or sublicense the App; reverse-engineer or attempt to extract the source code; use the App for any unlawful purpose.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">4. Payment and Refunds</h2>
            <p>Paid plans are billed via Stripe. Annual subscriptions renew automatically. Lifetime licenses are one-time purchases with no recurring charge.</p>
            <p className="mt-3">We offer a <strong className="text-[#1C1812]">7-day refund policy</strong> for all paid plans. If you are unsatisfied for any reason within 7 days of purchase, contact us at <a href={`mailto:${EMAIL}`} className="underline hover:text-[#1C1812]">{EMAIL}</a> for a full refund.</p>
            <p className="mt-3">After 7 days, refunds are issued at our discretion.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">5. Your Data</h2>
            <p>Marrow Library is local-first. All collection data is stored on your device. We do not have access to, and do not store, your collection data on our servers.</p>
            <p className="mt-3">You are solely responsible for backing up your data. We are not liable for any data loss resulting from device failure, software errors, or user action.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">6. Third-Party Services</h2>
            <p>The App uses the following third-party services:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-[#1C1812]">eBay API</strong> — for live market valuation data</li>
              <li><strong className="text-[#1C1812]">Stripe</strong> — for payment processing</li>
              <li><strong className="text-[#1C1812]">Open Library / TMDB / Discogs</strong> — for metadata lookup</li>
            </ul>
            <p className="mt-3">Use of these services is subject to their respective terms of service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">7. Disclaimer of Warranties</h2>
            <p>The App is provided "as is" without warranty of any kind. We do not warrant that the App will be error-free, uninterrupted, or that valuations will be accurate. Market valuations are estimates based on third-party data and should not be relied upon for financial, insurance, or legal decisions without independent verification.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Marrow Library and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App, including but not limited to data loss, loss of revenue, or inaccurate valuations.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">9. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the new Terms. We will notify users of material changes via the website.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">10. Contact</h2>
            <p>Questions about these Terms? Email us at <a href={`mailto:${EMAIL}`} className="underline hover:text-[#1C1812]">{EMAIL}</a></p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t flex gap-6 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
          <Link href="/privacy" className="hover:text-[#57503F] transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-[#57503F] transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}
