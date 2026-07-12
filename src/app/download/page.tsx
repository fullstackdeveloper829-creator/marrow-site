import Link from "next/link";
import type { Metadata } from "next";
import NotifyForm from "@/components/NotifyForm";

export const metadata: Metadata = {
  title: "Download Marrow Library — Coming Soon | Windows, macOS, Android & iOS",
  description: "Marrow Library downloads are coming soon for Windows, macOS, Android & iOS. Scan barcodes, track values, manage loans. Join the waitlist to get first access.",
  openGraph: {
    title: "Download Marrow Library — Coming Soon",
    description: "Downloads coming soon for Mac, Windows, Android & iOS. Catalog books, vinyl, games, movies & more. Join the waitlist for first access.",
    url: "https://marrow-site.vercel.app/download",
    images: [{ url: "https://marrow-site.vercel.app/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://marrow-site.vercel.app/download" },
};

const FEATURES = [
  "Unlimited items",
  "All 13 media types",
  "Barcode scanning",
  "Live eBay valuation",
  "Backup & restore",
  "Lending tracker",
  "CSV import/export",
  "Activity log",
];

const PLATFORMS = [
  { key: "windows", icon: "🪟", label: "Windows", sub: "Windows 10 / 11 · 64-bit" },
  { key: "macos", icon: "🍏", label: "macOS", sub: "macOS 11+ · Universal (M1 + Intel)" },
  { key: "android", icon: "🤖", label: "Android Scanner", sub: "Android 8.0+ · Companion scanner app" },
  { key: "ios", icon: "🍎", label: "iOS Scanner", sub: "iPhone · Companion scanner app" },
];

export default function DownloadPage() {
  return (
    <main className="min-h-screen px-4 sm:px-6 py-20" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-sm font-medium mb-8 inline-block transition-colors"
            style={{ color: "var(--text-2)" }}>
            ← Back to home
          </Link>
          <div className="mb-6">
            <span className="stamp text-sm">Coming Soon</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight"
            style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}>
            Downloads are coming soon
          </h1>
          <p className="text-base" style={{ color: "var(--text-2)" }}>
            Marrow Library is almost ready. Join the waitlist and we&apos;ll email you the moment it launches.
          </p>
        </div>

        {/* Coming soon card */}
        <div className="card-ink overflow-hidden">

          {/* Card header */}
          <div className="px-8 pt-10 pb-6 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: "var(--indigo-subtle)",
                  color: "var(--indigo-light)",
                  border: "1px solid var(--indigo)",
                  fontFamily: "var(--font-mono)",
                }}>
                Planned Launch Price
              </span>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}>$20</div>
                <div className="text-xs" style={{ color: "var(--text-3)" }}>one-time</div>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text-1)" }}>Marrow Library</h2>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              3 months of everything. Pay once and it&apos;s yours — no subscription, ever.
            </p>
          </div>

          {/* What's coming */}
          <div className="px-8 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
              What&apos;s coming
            </p>
            <ul className="grid grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-2)" }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: "rgba(63,107,79,0.14)", color: "var(--moss)" }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Platform list — coming soon, not downloadable */}
          <div className="px-8 pb-6">
            <div className="rounded-xl overflow-hidden"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  Planned platforms
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {PLATFORMS.map(p => (
                  <div key={p.key} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="text-xl flex-shrink-0 w-7 text-center">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{p.label}</div>
                      <div className="text-xs truncate" style={{ color: "var(--text-3)" }}>{p.sub}</div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded flex-shrink-0"
                      style={{
                        color: "var(--indigo-light)",
                        border: "1px solid var(--indigo)",
                        fontFamily: "var(--font-mono)",
                      }}>
                      Coming soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Waitlist */}
          <div className="px-8 pb-8">
            <NotifyForm source="download" />
          </div>
        </div>

        {/* Launch note */}
        <div className="rounded-2xl p-6 text-center mt-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-1)" }}>
            Planned pricing: $20 one-time, no subscription.
          </p>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Waitlist members get first access and lock in the launch price.
          </p>
        </div>

      </div>
    </main>
  );
}
