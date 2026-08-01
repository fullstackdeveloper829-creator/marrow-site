/**
 * POST /api/provision-tunnel
 *
 * Called by the web-client (self-hosted app) to get a permanent public
 * hostname without any manual `cloudflared login`/`create`/`route` steps.
 * Requires a valid credential in the request body — either the legacy HMAC
 * license key (`validateLicenseKey`) or the newer email-based session token
 * (`verifySession`), since either one may be what a given install has
 * stored (see apps/web-client/src/lib/license.ts). Anonymous calls are
 * rejected outright: this endpoint burns real Cloudflare API quota (tunnel +
 * DNS record creation) per call, so it must not be callable by anyone who
 * doesn't own a license.
 *
 * Rate-limited per IP, mirroring the in-memory bucket pattern already used
 * by /api/auth/verify-email.
 */
import { NextRequest, NextResponse } from "next/server";
import { validateLicenseKey, verifySession } from "@/lib/license";
import { getCloudflareEnv, provisionTunnel, CloudflareProvisionError } from "@/lib/cloudflareProvision";

export const dynamic = "force-dynamic";

// ── CORS ─────────────────────────────────────────────────────────────────
// Callers are self-hosted desktop-app instances on arbitrary origins
// (each user's own http://localhost:3000), not one fixed frontend domain,
// so this allows any origin. No cookies/credentials are used — auth is a
// bearer-style credential in the JSON body — so a wildcard origin here
// doesn't expose anything a fixed origin would have protected.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ── Rate limiter (per IP) ───────────────────────────────────────────────────
// Provisioning creates real cloud resources, so this is intentionally
// stricter than the 5/hour on verify-email.

const RATE_LIMIT = 3;
const WINDOW_MS  = 3_600_000;

const g = globalThis as typeof globalThis & {
  __provisionRateLimiter?: Map<string, number[]>;
};
if (!g.__provisionRateLimiter) g.__provisionRateLimiter = new Map();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = (g.__provisionRateLimiter!.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (bucket.length >= RATE_LIMIT) return false;
  bucket.push(now);
  g.__provisionRateLimiter!.set(ip, bucket);
  return true;
}

// ── Credential validation ───────────────────────────────────────────────────

function validateCredential(credential: string, secret: string): { valid: boolean; identifier?: string; error?: string } {
  // Try legacy license key first, then session token — accept whichever the
  // caller's install actually has stored locally.
  const asLicenseKey = validateLicenseKey(credential, secret);
  if (asLicenseKey.valid && asLicenseKey.payload) {
    return { valid: true, identifier: asLicenseKey.payload.email };
  }

  const asSession = verifySession(credential, secret);
  if (asSession.valid && asSession.payload) {
    return { valid: true, identifier: asSession.payload.email };
  }

  return { valid: false, error: asLicenseKey.error ?? asSession.error ?? "Invalid credential" };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const res = await handlePost(req);
  for (const [key, value] of Object.entries(CORS_HEADERS)) res.headers.set(key, value);
  return res;
}

async function handlePost(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many tunnel-provisioning attempts. Please wait an hour and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const credential = (body as { licenseKey?: string }).licenseKey;
  if (typeof credential !== "string" || !credential.trim()) {
    return NextResponse.json({ error: "Missing 'licenseKey' field" }, { status: 400 });
  }

  const secret = process.env.MARROW_LICENSE_SECRET;
  if (!secret) {
    console.error("[provision-tunnel] MARROW_LICENSE_SECRET not set");
    return NextResponse.json({ error: "Server misconfiguration. Please contact support." }, { status: 500 });
  }

  const credResult = validateCredential(credential.trim(), secret);
  if (!credResult.valid || !credResult.identifier) {
    return NextResponse.json({ error: credResult.error ?? "Invalid or expired license." }, { status: 401 });
  }

  const cfEnv = getCloudflareEnv();
  if (!cfEnv) {
    console.error("[provision-tunnel] Cloudflare env vars not configured");
    return NextResponse.json(
      {
        error:
          "Permanent-link provisioning is not configured on the server yet. " +
          "(Missing CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_ZONE_ID.)",
      },
      { status: 503 }
    );
  }

  try {
    const { tunnelToken, hostname } = await provisionTunnel(cfEnv, credResult.identifier);
    return NextResponse.json({ tunnelToken, hostname });
  } catch (err) {
    const message = err instanceof CloudflareProvisionError ? err.message : "Failed to provision tunnel.";
    console.error("[provision-tunnel] Cloudflare provisioning failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
