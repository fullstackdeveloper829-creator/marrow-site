import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Marrow Library — Windows, macOS, Android & iOS",
  description: "Download Marrow Library free. Windows 10/11, macOS 11+, Android 8+, iOS. Scan barcodes, track values, manage loans. $20 one-time, no subscription.",
  openGraph: {
    title: "Download Marrow Library — Windows, macOS, Android & iOS",
    description: "Download free. Catalog books, vinyl, games, movies & more. $20 once, no subscription. Mac, Windows, Android, iOS.",
    url: "https://marrow-site.vercel.app/download",
    images: [{ url: "https://marrow-site.vercel.app/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://marrow-site.vercel.app/download" },
};

// Revalidate every hour — picks up new releases automatically
export const revalidate = 3600;

const REPO = "fullstackdeveloper829-creator/marrow-library";

// ── Known-good fallback: last confirmed stable release ────────────────────────
// Update these whenever a new release is published to GitHub.
// Used when the GitHub API is unavailable (e.g. private repo, rate limit).
const STABLE_VERSION = "v1.3.2";
const STABLE_BASE    = `https://github.com/${REPO}/releases/download/${STABLE_VERSION}`;
const STABLE_ASSETS  = {
  windows: { url: `${STABLE_BASE}/MarrowLibrary-${STABLE_VERSION}-windows-setup.exe`, size: 27_800_000 },
  macos:   { url: `${STABLE_BASE}/MarrowLibrary-${STABLE_VERSION}-macos-universal.dmg`, size: 112_000_000 },
  android: { url: `${STABLE_BASE}/MarrowScanner-${STABLE_VERSION}-android.apk`, size: 91_800_000 },
};

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface Release {
  tag_name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

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

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(0)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

async function getLatestRelease(): Promise<Release | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: { "User-Agent": "MarrowSite/1.0" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    return res.json() as Promise<Release>;
  } catch {
    return null;
  }
}

function findAsset(assets: ReleaseAsset[], pattern: RegExp): ReleaseAsset | undefined {
  return assets.find(a => pattern.test(a.name));
}

export default async function DownloadPage() {
  const release = await getLatestRelease();
  // If GitHub API unavailable (private repo / rate limit), fall back to known stable
  const version  = release?.tag_name ?? STABLE_VERSION;
  const assets   = release?.assets   ?? [];

  const winAsset     = findAsset(assets, /windows.*\.exe$/i) || findAsset(assets, /\.exe$/i);
  const macAsset     = findAsset(assets, /macos.*\.dmg$/i)   || findAsset(assets, /\.dmg$/i);
  const androidAsset = findAsset(assets, /android.*\.apk$/i) || findAsset(assets, /\.apk$/i);

  const platforms = [
    {
      key: "windows",
      icon: "🪟",
      label: "Windows",
      sub: "Windows 10 / 11 · 64-bit · 4 GB RAM · 200 MB storage",
      badge: ".exe",
      asset: winAsset ?? { browser_download_url: STABLE_ASSETS.windows.url, name: `MarrowLibrary-${version}-windows-setup.exe`, size: STABLE_ASSETS.windows.size },
    },
    {
      key: "macos",
      icon: "🍏",
      label: "macOS",
      sub: "macOS 11 (Big Sur)+ · Universal (M1 + Intel) · 200 MB storage",
      badge: ".dmg",
      asset: macAsset ?? { browser_download_url: STABLE_ASSETS.macos.url, name: `MarrowLibrary-${version}-macos-universal.dmg`, size: STABLE_ASSETS.macos.size },
    },
    {
      key: "android",
      icon: "🤖",
      label: "Android Scanner",
      sub: "Android 8.0+ · Free companion barcode scanning app",
      badge: ".apk",
      asset: androidAsset ?? { browser_download_url: STABLE_ASSETS.android.url, name: `MarrowScanner-${version}-android.apk`, size: STABLE_ASSETS.android.size },
    },
    {
      key: "ios",
      icon: "🍎",
      label: "iOS Scanner",
      sub: "iPhone · Join the TestFlight beta waitlist",
      badge: "Beta",
      asset: undefined as ReleaseAsset | undefined,
    },
  ];

  return (
    <main className="min-h-screen px-4 sm:px-6 py-20" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-sm font-medium mb-8 inline-block transition-colors hover:text-white"
            style={{ color: "var(--text-2)" }}>
            ← Back to home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
            Download Marrow Library
          </h1>
          <div className="flex items-center justify-center gap-3">
            <p className="text-base" style={{ color: "var(--text-2)" }}>
              Free trial · Full access from $20 once · no subscription
            </p>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full border"
              style={{ background: "rgba(91,82,240,0.1)", borderColor: "rgba(91,82,240,0.3)", color: "#a5b4fc" }}>
              {version}
            </span>
          </div>
          {release?.published_at && (
            <p className="text-xs mt-2" style={{ color: "var(--text-3)" }}>
              Released {formatDate(release.published_at)}
            </p>
          )}
        </div>

        {/* Free trial info */}
        <div className="rounded-2xl border p-6 mb-4"
          style={{ background: "rgba(91,82,240,0.04)", borderColor: "rgba(91,82,240,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#a5b4fc" }}>
            What the free trial includes
          </p>
          <ul className="grid grid-cols-2 gap-2 mb-3">
            {["Unlimited items cataloged","Barcode scanning","Basic search & filters","CSV & PDF export","Local-first, 100% offline","All 13 media types"].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#9090c0" }}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: "rgba(91,82,240,0.2)", color: "#a5b4fc" }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <p className="text-xs" style={{ color: "#606090" }}>
            After trial: unlock live eBay valuations, price alerts, Discogs import, insurance PDF, and lending tracker — from <strong style={{ color: "#a5b4fc" }}>$20 once</strong>, no subscription.
          </p>
        </div>

        {/* Purchase card */}
        <div className="rounded-2xl border overflow-hidden relative"
          style={{
            background: "linear-gradient(160deg, #0d0d22 0%, #0a0a1a 100%)",
            borderColor: "#5b52f0",
            boxShadow: "0 0 60px rgba(91,82,240,0.15)",
          }}>

          {/* Card header */}
          <div className="px-8 pt-10 pb-6 border-b" style={{ borderColor: "rgba(91,82,240,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: "rgba(91,82,240,0.2)", color: "#a5b4fc", border: "1px solid rgba(91,82,240,0.4)" }}>
                Full Access
              </span>
              <div className="text-right">
                <div className="text-3xl font-black text-white">$20</div>
                <div className="text-xs" style={{ color: "var(--text-3)" }}>one-time</div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Marrow Library</h2>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              3 months of everything. Pay once and it&apos;s yours.
            </p>
          </div>

          {/* Features */}
          <div className="px-8 py-6">
            <ul className="grid grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#e0e0f0" }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: "rgba(91,82,240,0.2)", color: "#a5b4fc" }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Buy button */}
          <div className="px-8 pb-6">
            <Link href="/api/checkout?tier=COLLECTOR&billing=launch"
              className="flex items-center justify-center w-full px-6 py-4 rounded-xl text-base font-bold text-white text-center transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #5b52f0, #7c74f5)", boxShadow: "0 0 30px rgba(91,82,240,0.35)" }}>
              Buy Now — $20 →
            </Link>
          </div>

          {/* Platform download grid */}
          <div className="px-8 pb-8">
            <div className="rounded-xl border overflow-hidden"
              style={{ background: "rgba(91,82,240,0.04)", borderColor: "rgba(91,82,240,0.12)" }}>
              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                  Download {version}
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {platforms.map(p => {
                  const url       = p.asset?.browser_download_url ?? `https://github.com/${REPO}/releases/tag/${version}`;
                  const size      = p.asset ? formatBytes(p.asset.size) : null;
                  const available = !!p.asset || p.key === "ios";
                  return (
                    <a
                      key={p.key}
                      href={p.key === "ios" ? "mailto:support@marrowlibrary.app?subject=iOS%20Scanner%20Early%20Access" : url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-5 py-3.5 transition-colors group ${
                        available
                          ? "hover:bg-white/[0.03] cursor-pointer"
                          : "opacity-40 cursor-not-allowed pointer-events-none"
                      }`}
                    >
                      <span className="text-xl flex-shrink-0 w-7 text-center">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{p.label}</div>
                        <div className="text-xs truncate" style={{ color: "var(--text-3)" }}>{p.sub}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {size && (
                          <span className="text-xs" style={{ color: "var(--text-3)" }}>{size}</span>
                        )}
                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{ background: "var(--surface-2)", color: "#a5b4fc" }}>
                          {p.badge}
                        </span>
                        {available && (
                          <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "#a5b4fc" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Purchase links sent to your email instantly after checkout.
                </p>
              </div>
            </div>

            <p className="text-xs text-center mt-4" style={{ color: "var(--text-3)" }}>
              No auto-renewal · No credit card stored · Secure checkout via Stripe
            </p>
          </div>
        </div>

        {/* Already purchased */}
        <div className="rounded-2xl p-6 border text-center mt-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#e4e4e7" }}>
            Already purchased?
          </p>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Your download link is in your email. Or download directly above and enter your
            email in{" "}
            <span className="font-mono text-xs px-1.5 py-0.5 rounded"
              style={{ background: "var(--surface-2)", color: "#a1a1aa" }}>
              Settings → License
            </span>{" "}
            to activate.
          </p>
        </div>

        {/* All releases link */}
        <div className="text-center mt-6">
          <a
            href={`https://github.com/${REPO}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-colors hover:text-white"
            style={{ color: "var(--text-3)" }}
          >
            View all releases on GitHub →
          </a>
        </div>

      </div>
    </main>
  );
}
