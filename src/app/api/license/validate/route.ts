import { NextRequest, NextResponse } from "next/server";
import { validateLicenseKey } from "@/lib/license";

export const dynamic = "force-dynamic";

// ── In-process rate limit: 5 attempts per IP per 15 min ──────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RL_MAX = 5;
const RL_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false;
  }
  if (entry.count >= RL_MAX) return true;
  entry.count++;
  return false;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "127.0.0.1";

  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { valid: false, error: "Too many requests. Please wait 15 minutes and try again." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ valid: false, error: "Missing key parameter" }, { status: 400 });
  }

  const secret = process.env.MARROW_LICENSE_SECRET;
  if (!secret) {
    console.error("[license/validate] MARROW_LICENSE_SECRET not set");
    return NextResponse.json({ valid: false, error: "Server misconfiguration" }, { status: 500 });
  }

  const result = validateLicenseKey(key, secret);

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 200 });
  }

  return NextResponse.json({
    valid: true,
    tier:      result.payload?.tier,
    email:     result.payload?.email,
    expiresAt: result.payload?.expiresAt,
  });
}
