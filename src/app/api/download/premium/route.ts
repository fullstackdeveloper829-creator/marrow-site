/**
 * /api/download/premium
 *
 * POST { key, platform } — preferred path; key stays out of URL and browser history.
 * GET  ?key=...&platform=... — kept for backward compatibility with existing email links.
 *
 * Validates the license key and redirects to the platform-specific download URL
 * for the LATEST GitHub release — no manual version bumps needed.
 * Returns 403 if the key is missing, invalid, or FREE tier.
 */
import { NextRequest, NextResponse } from "next/server";
import { validateLicenseKey, PAID_TIERS, type LicenseTier } from "@/lib/license";
import { GITHUB_REPO, FALLBACK_RELEASE, SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STABLE_URLS: Record<string, string> = {
  windows: `https://github.com/${GITHUB_REPO}/releases/download/${FALLBACK_RELEASE}/MarrowLibrary-${FALLBACK_RELEASE}-windows-setup.exe`,
  macos:   `https://github.com/${GITHUB_REPO}/releases/download/${FALLBACK_RELEASE}/MarrowLibrary-${FALLBACK_RELEASE}-macos-universal.dmg`,
  android: `https://github.com/${GITHUB_REPO}/releases/download/${FALLBACK_RELEASE}/MarrowScanner-${FALLBACK_RELEASE}-android.apk`,
  ios:     `https://github.com/${GITHUB_REPO}/releases/download/${FALLBACK_RELEASE}/MarrowScanner-${FALLBACK_RELEASE}-ios-simulator.tar.gz`,
};
const VALID_PLATFORMS = ["macos", "windows", "android", "ios"] as const;
type Platform = typeof VALID_PLATFORMS[number];

const PLATFORM_LABELS: Record<Platform, string> = {
  macos:   "macOS",
  windows: "Windows",
  android: "Android",
  ios:     "iOS Simulator",
};

async function getLatestAssetUrls(): Promise<Record<Platform, string> | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: { "User-Agent": "MarrowSite/1.0" },
        next: { revalidate: 900 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { tag_name?: string; assets?: Array<{ name: string; browser_download_url: string }> };
    const tag = data.tag_name;
    if (!tag) return null;

    const base = `https://github.com/${GITHUB_REPO}/releases/download/${tag}`;
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

async function handleDownload(key: string | null, platform: string | null): Promise<NextResponse> {
  if (!platform || !(VALID_PLATFORMS as readonly string[]).includes(platform)) {
    return NextResponse.json(
      { error: `Invalid platform. Valid: ${VALID_PLATFORMS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!key) {
    return NextResponse.redirect(`${SITE_URL}/download?error=key_required`);
  }

  const secret = process.env.MARROW_LICENSE_SECRET;
  if (!secret) {
    console.error("[download/premium] MARROW_LICENSE_SECRET not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const result = validateLicenseKey(key, secret);
  if (!result.valid) {
    return NextResponse.redirect(
      `${SITE_URL}/download?error=${encodeURIComponent(result.error ?? "invalid_key")}`
    );
  }

  const tier = result.payload!.tier as LicenseTier;
  if (!PAID_TIERS.includes(tier)) {
    return NextResponse.redirect(`${SITE_URL}/download?error=upgrade_required`);
  }

  const assetUrls = await getLatestAssetUrls();
  const typedPlatform = platform as Platform;

  if (!assetUrls) {
    console.warn("[download/premium] GitHub API unavailable — serving stable fallback");
    const fallback = STABLE_URLS[typedPlatform];
    if (!fallback) return NextResponse.redirect(`https://github.com/${GITHUB_REPO}/releases/tag/${FALLBACK_RELEASE}`);
    return NextResponse.redirect(fallback);
  }

  const email = result.payload!.email;
  console.log(`[download/premium] ${email} (${tier}) → ${PLATFORM_LABELS[typedPlatform]}`);

  return NextResponse.redirect(assetUrls[typedPlatform]);
}

// POST is the canonical path — key goes in the request body, not the URL.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";
  let key: string | null = null;
  let platform: string | null = null;

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    key      = form.get("key")      as string | null;
    platform = form.get("platform") as string | null;
  } else {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    key      = typeof body["key"]      === "string" ? body["key"]      : null;
    platform = typeof body["platform"] === "string" ? body["platform"] : null;
  }

  return handleDownload(key, platform);
}

// GET kept for backward compatibility with links already in circulation.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const key      = searchParams.get("key");
  const platform = searchParams.get("platform");
  return handleDownload(key, platform);
}
