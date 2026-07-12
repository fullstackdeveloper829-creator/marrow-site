import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Marrow Library offers a 14-day no-questions-asked full refund. Not satisfied? Email us for an instant refund — no questions asked.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://marrow-site.vercel.app/refund" },
  openGraph: {
    type: "website",
    title: "Refund Policy | Marrow Library",
    description: "14-day no-questions-asked full refund on all purchases. Email us and get an instant refund.",
    url: "https://marrow-site.vercel.app/refund",
    images: [{ url: "https://marrow-site.vercel.app/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

const EMAIL = "fullstackdeveloper829@gmail.com";
const LAST_UPDATED = "7 June 2026";

export default function RefundPage() {
  return (
    <main className="min-h-screen px-6 py-20" style={{ background: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm hover:text-[#1C1812] transition-colors mb-10 inline-block" style={{ color: "var(--text-2)" }}>
          ← Back to home
        </Link>

        <h1 className="text-4xl font-black text-[#1C1812] mb-2">Refund Policy</h1>
        <p className="text-sm mb-12" style={{ color: "var(--text-3)" }}>Last updated: {LAST_UPDATED}</p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">14-Day Money-Back Guarantee</h2>
            <p>
              If you are unsatisfied with Marrow Library Pro for <strong className="text-[#1C1812]">any reason</strong> within
              14 days of purchase, email us at{" "}
              <a href={`mailto:${EMAIL}`} className="underline hover:text-[#1C1812]">{EMAIL}</a> and
              we will issue a full refund — no questions asked, no hoops to jump through.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">How to Request a Refund</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Email <a href={`mailto:${EMAIL}`} className="underline hover:text-[#1C1812]">{EMAIL}</a> from the address you used to purchase.</li>
              <li>Include the subject line: <strong className="text-[#1C1812]">Refund Request</strong>.</li>
              <li>We will process your refund within 1–3 business days.</li>
            </ol>
            <p className="mt-4">You do not need to provide a reason, uninstall the app, or return anything.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">Eligibility</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Refunds are available within <strong className="text-[#1C1812]">14 days</strong> of the original purchase date.</li>
              <li>Only applies to the one-time Pro license ($20 USD).</li>
              <li>Refunds are not available for purchases older than 14 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">After a Refund</h2>
            <p>
              Your Pro license will be deactivated. The app will revert to the free tier (up to 50 items).
              Your collection data stays on your device — we never delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1C1812] mb-3">Questions?</h2>
            <p>
              Email us at{" "}
              <a href={`mailto:${EMAIL}`} className="underline hover:text-[#1C1812]">{EMAIL}</a> — we read everything.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t flex gap-6 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
          <Link href="/terms" className="hover:text-[#57503F] transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-[#57503F] transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-[#57503F] transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}
