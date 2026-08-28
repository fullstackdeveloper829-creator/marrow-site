/**
 * GET /api/download/premium?key=<license_key>&platform=macos|windows|android
 *
 * Validates the license key and redirects to the platform-specific download URL
 * for the LATEST GitHub release — no manual version bumps needed.
 * Returns 403 if the key is missing, invalid, or FREE tier.
 */
import { NextRequest, NextResponse } from "next/server";
import { validateLicenseKey, PAID_TIERS, type LicenseTier } from "@/lib/license";

export const dynamic = "force-dynamic";

const REPO    = "fullstackdeveloper829-creator/marrow-library";
const STABLE  = "v5";
const STABLE_URLS: Record<string, string> = {
  windows: `https://github.com/${REPO}/releases/download/${STABLE}/MarrowLibrary-${STABLE}-windows-setup.exe`,
  macos:   `https://github.com/${REPO}/releases/download/${STABLE}/MarrowLibrary-${STABLE}-macos-universal.dmg`,
  android: `https://github.com/${REPO}/releases/download/${STABLE}/MarrowScanner-${STABLE}-android.apk`,
  ios:     `https://github.com/${REPO}/releases/download/${STABLE}/MarrowScanner-${STABLE}-ios-simulator.tar.gz`,
};
const VALID_PLATFORMS = ["macos", "windows", "android", "ios"] as const;
type Platform = typeof VALID_PLATFORMS[number];

const PLATFORM_LABELS: Record<Platform, string> = {
  macos:   "macOS",
  windows: "Windows",
  android: "Android",
  ios:     "iOS Simulator",
};

// Fetch the latest release tag and build per-platform asset URLs dynamically.
// Cached for 15 minutes via Next.js fetch cache so each download doesn't hit GitHub.
async function getLatestAssetUrls(): Promise<Record<Platform, string> | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: { "User-Agent": "MarrowSite/1.0" },
        next: { revalidate: 900 }, // 15 min
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { tag_name?: string; assets?: Array<{ name: string; browser_download_url: string }> };
    const tag = data.tag_name;
    if (!tag) return null;

    const base = `https://github.com/${REPO}/releases/download/${tag}`;

    // Build URL from asset list if available, fallback to name convention
    const findAsset = (pattern: RegExp) =>
      data.assets?.find(a => pattern.test(a.name))?.browser_download_url;

    return {
      macos:   findAsset(/macos.*\.dmg$/i)   ?? `${base}/MarrowLibrary-${tag}-macos-universal.dmg`,
      windows: findAsset(/windows.*\.exe$/i) ?? `${base}/MarrowLibrary-${tag}-windows-setup.exe`,
      android: findAsset(/android.*\.apk$/i) ?? `${base}/MarrowScanner-${tag}-android.apk`,
      ios:     findAsset(/ios.*\.tar\.gz$/i) ?? `${base}/MarrowScanner-${tag}-ios-simulator.tar.gz`,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const key      = searchParams.get("key");
  const platform = searchParams.get("platform") as Platform | null;
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marrow-site.vercel.app";

  // ── Validate platform ────────────────────────────────────────────────────────
  if (!platform || !(VALID_PLATFORMS as readonly string[]).includes(platform)) {
    return NextResponse.json(
      { error: `Invalid platform. Valid: ${VALID_PLATFORMS.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Validate license key ─────────────────────────────────────────────────────
  if (!key) {
    return NextResponse.redirect(`${siteUrl}/download?error=key_required`);
  }

  const secret = process.env.MARROW_LICENSE_SECRET;
  if (!secret) {
    console.error("[download/premium] MARROW_LICENSE_SECRET not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const result = validateLicenseKey(key, secret);

  if (!result.valid) {
    return NextResponse.redirect(
      `${siteUrl}/download?error=${encodeURIComponent(result.error ?? "invalid_key")}`
    );
  }

  const tier = result.payload!.tier as LicenseTier;
  if (!PAID_TIERS.includes(tier)) {
    return NextResponse.redirect(`${siteUrl}/download?error=upgrade_required`);
  }

  // ── Resolve latest download URL ───────────────────────────────────────────────
  const assetUrls = await getLatestAssetUrls();

  if (!assetUrls) {
    // GitHub API unavailable (private repo) — fall back to known stable release
    console.warn("[download/premium] GitHub API unavailable — serving stable fallback");
    const fallback = STABLE_URLS[platform];
    if (!fallback) return NextResponse.redirect(`https://github.com/${REPO}/releases/tag/${STABLE}`);
    return NextResponse.redirect(fallback);
  }

  const email = result.payload!.email;
  console.log(`[download/premium] ${email} (${tier}) → ${PLATFORM_LABELS[platform]}`);

  return NextResponse.redirect(assetUrls[platform]);
}
