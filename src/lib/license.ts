import { createHmac, timingSafeEqual } from "crypto";

export type LicenseTier = "FREE" | "COLLECTOR" | "CURATOR";

// ── Session token (email-based activation) ────────────────────────────────────
export interface SessionPayload {
  email: string;
  purchasedAt: number; // unix ms
  iat: number;
}

export function signSession(payload: SessionPayload, secret: string): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  const hmac    = computeHmac(encoded, secret);
  return `${encoded}.${hmac}`;
}

export interface SessionValidationResult {
  valid: boolean;
  payload?: SessionPayload;
  error?: string;
}

export function verifySession(token: string, secret: string): SessionValidationResult {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return { valid: false, error: "Malformed session token" };

  const encoded = token.slice(0, dot);
  const providedHmac = token.slice(dot + 1);
  const expectedHmac = computeHmac(encoded, secret);

  let equal = false;
  try {
    equal = timingSafeEqual(
      Buffer.from(providedHmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return { valid: false, error: "Invalid session token signature" };
  }
  if (!equal) return { valid: false, error: "Session token signature mismatch" };

  let payload: unknown;
  try {
    payload = JSON.parse(fromBase64Url(encoded));
  } catch {
    return { valid: false, error: "Session token could not be decoded" };
  }

  const p = payload as Record<string, unknown>;
  if (typeof p["email"] !== "string" || typeof p["purchasedAt"] !== "number") {
    return { valid: false, error: "Session token missing required fields" };
  }

  return {
    valid: true,
    payload: {
      email: p["email"] as string,
      purchasedAt: p["purchasedAt"] as number,
      iat: typeof p["iat"] === "number" ? (p["iat"] as number) : 0,
    },
  };
}

export interface LicensePayload {
  tier: LicenseTier;
  email: string;
  orderId: string;
  issuedAt: number;
  expiresAt: number | null;
}

export interface LicenseValidationResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
}

export type LicenseFeature =
  | "unlimited_items"
  | "valuation"
  | "backup"
  | "lending"
  | "multi_user"
  | "csv_import"
  | "activity_log";

export const FREE_ITEM_LIMIT = 50;

/** All valid tiers — exported so callers don't re-declare this list. */
export const VALID_TIERS: LicenseTier[] = ["FREE", "COLLECTOR", "CURATOR"];

/** Tiers that require a paid license — FREE is never issued via checkout. */
export const PAID_TIERS: LicenseTier[] = ["COLLECTOR", "CURATOR"];

function toBase64Url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function computeHmac(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

export function generateLicenseKey(payload: LicensePayload, secret: string): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  const hmac = computeHmac(encoded, secret);
  return `${encoded}.${hmac}`;
}

export function validateLicenseKey(key: string, secret: string): LicenseValidationResult {
  const dotIndex = key.lastIndexOf(".");
  if (dotIndex === -1) {
    return { valid: false, error: "Malformed license key: missing separator" };
  }

  const encoded = key.slice(0, dotIndex);
  const providedHmac = key.slice(dotIndex + 1);

  const expectedHmac = computeHmac(encoded, secret);

  let equal = false;
  try {
    equal = timingSafeEqual(
      Buffer.from(providedHmac, "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return { valid: false, error: "Invalid license key signature" };
  }

  if (!equal) {
    return { valid: false, error: "License key signature mismatch" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(fromBase64Url(encoded));
  } catch {
    return { valid: false, error: "License key payload could not be decoded" };
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("tier" in payload) ||
    !("email" in payload) ||
    !("orderId" in payload) ||
    !("issuedAt" in payload) ||
    !("expiresAt" in payload)
  ) {
    return { valid: false, error: "License key payload is missing required fields" };
  }

  const typed = payload as Record<string, unknown>;

  if (!VALID_TIERS.includes(typed["tier"] as LicenseTier)) {
    return { valid: false, error: `Unknown license tier: ${String(typed["tier"])}` };
  }

  const licensePayload: LicensePayload = {
    tier: typed["tier"] as LicenseTier,
    email: String(typed["email"]),
    orderId: String(typed["orderId"]),
    issuedAt: Number(typed["issuedAt"]),
    expiresAt: typed["expiresAt"] === null ? null : Number(typed["expiresAt"]),
  };

  if (
    licensePayload.expiresAt !== null &&
    licensePayload.expiresAt < Date.now()
  ) {
    return { valid: false, error: "License key has expired", payload: licensePayload };
  }

  return { valid: true, payload: licensePayload };
}

export function tierHasFeature(tier: LicenseTier, feature: LicenseFeature): boolean {
  switch (tier) {
    case "FREE":
      return false;
    case "COLLECTOR":
      return (
        feature === "unlimited_items" ||
        feature === "valuation" ||
        feature === "backup" ||
        feature === "lending"
      );
    case "CURATOR":
      return true;
  }
}
