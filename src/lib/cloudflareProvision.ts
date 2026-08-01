/**
 * Cloudflare Tunnel provisioning for the automated "permanent link" flow.
 *
 * Every paying customer gets their own Cloudflare Tunnel (created via the
 * Cloudflare API, remotely-managed / token-based) plus a DNS CNAME on
 * marrowlibrary.com pointing at it. The customer's own `cloudflared` process
 * then runs `cloudflared tunnel run --token <TOKEN>` — no login, no
 * cert.pem, no manual `cloudflared tunnel create` on their machine.
 *
 * Requires these env vars (see apps/marketing-site/.env.example):
 *   CLOUDFLARE_API_TOKEN   — API token scoped to the zone/account below.
 *                             Needs "Cloudflare Tunnel: Edit" (Zero Trust)
 *                             and "DNS: Edit" permissions.
 *   CLOUDFLARE_ACCOUNT_ID  — the Cloudflare account that owns the tunnel.
 *   CLOUDFLARE_ZONE_ID     — the zone ID for marrowlibrary.com (or whatever
 *                             domain subdomains are cut from).
 *   MARROW_TUNNEL_DOMAIN   — optional, defaults to "marrowlibrary.com".
 *
 * This module intentionally does NOT know about any particular customer's
 * local machine — Cloudflare Tunnel Tokens work by the customer's own
 * cloudflared process connecting outbound and registering itself, so the
 * ingress rules configured here are the same for every tunnel (matching the
 * restricted path allow-list already enforced by the named-tunnel mode in
 * apps/web-client/src/lib/cloudflaredTunnel.ts).
 */

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

// Same allow-list as startNamedTunnel() in cloudflaredTunnel.ts — keep in
// sync. Only the mobile scan page + sync endpoints are reachable publicly;
// everything else (dashboard, backup, GDPR export, item CRUD) must stay
// unreachable regardless of app-level auth, since /api/* is unauthenticated
// by design for local-first use.
const ALLOWED_PATH_REGEX =
  "^(/scanner\\.html($|\\?.*)|/mobile($|\\?.*)|/api/sync($|\\?.*)|/api/sync/devices($|\\?.*)|/favicon\\.ico($|\\?.*))$";

export interface CloudflareEnv {
  apiToken:  string;
  accountId: string;
  zoneId:    string;
  domain:    string;
}

export class CloudflareProvisionError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "CloudflareProvisionError";
  }
}

export function getCloudflareEnv(): CloudflareEnv | null {
  const apiToken  = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const zoneId    = process.env.CLOUDFLARE_ZONE_ID;
  if (!apiToken || !accountId || !zoneId) return null;
  const domain = process.env.MARROW_TUNNEL_DOMAIN ?? "marrowlibrary.com";
  return { apiToken, accountId, zoneId, domain };
}

async function cfFetch<T>(env: CloudflareEnv, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${CF_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.apiToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new CloudflareProvisionError(
      `Could not reach Cloudflare API: ${err instanceof Error ? err.message : "unknown error"}`
    );
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new CloudflareProvisionError(`Cloudflare API returned a non-JSON response (status ${res.status})`);
  }

  const parsed = body as { success?: boolean; result?: unknown; errors?: Array<{ message?: string }> };
  if (!res.ok || parsed.success === false) {
    const msg = parsed.errors?.map((e) => e.message).filter(Boolean).join("; ") || `HTTP ${res.status}`;
    throw new CloudflareProvisionError(`Cloudflare API error: ${msg}`, res.status >= 500 ? 502 : 502);
  }

  return parsed.result as T;
}

function randomSubdomainId(): string {
  // Short, URL-safe, not guessable enough to matter (paired with the
  // per-license rate limit + license-key gate on the endpoint itself).
  return Math.random().toString(36).slice(2, 10);
}

interface CfTunnelCreateResult {
  id:    string;
  name:  string;
  token: string;
}

/**
 * Creates a new remotely-managed ("token") Cloudflare Tunnel, points a
 * generated subdomain at it via DNS, and configures ingress to only expose
 * the mobile-scan surface. Returns the opaque connector token cloudflared
 * needs plus the public hostname.
 */
export async function provisionTunnel(env: CloudflareEnv, licenseIdentifier: string): Promise<{
  tunnelToken: string;
  hostname:    string;
}> {
  const subdomain = `lib-${randomSubdomainId()}`;
  const hostname  = `${subdomain}.${env.domain}`;
  // Tunnel names must be unique per account; derive from the subdomain so
  // it's traceable back to the DNS record without storing extra state.
  const tunnelName = `marrow-${subdomain}`;

  // 1. Create the tunnel (remotely-managed / token-based — no cert.pem).
  const tunnel = await cfFetch<CfTunnelCreateResult>(
    env,
    `/accounts/${env.accountId}/cfd_tunnel`,
    {
      method: "POST",
      body: JSON.stringify({
        name:        tunnelName,
        config_src:  "cloudflare", // remotely-managed config (vs. "local" config.yml)
        metadata:    { issuedTo: licenseIdentifier },
      }),
    }
  );

  if (!tunnel.token) {
    throw new CloudflareProvisionError("Cloudflare did not return a connector token for the new tunnel");
  }

  try {
    // 2. Configure ingress on the tunnel itself (remotely-managed config).
    //    Constant across every customer: same allow-list, same local origin
    //    port — the customer's own cloudflared is what makes localhost:3000
    //    reachable, Cloudflare's API has no visibility into their machine.
    await cfFetch(
      env,
      `/accounts/${env.accountId}/cfd_tunnel/${tunnel.id}/configurations`,
      {
        method: "PUT",
        body: JSON.stringify({
          config: {
            ingress: [
              {
                hostname: hostname,
                path:     ALLOWED_PATH_REGEX,
                service:  "http://localhost:3000",
              },
              {
                hostname: hostname,
                service:  "http_status:404",
              },
              { service: "http_status:404" },
            ],
          },
        }),
      }
    );

    // 3. DNS CNAME: hostname -> <tunnel-id>.cfargotunnel.com, proxied.
    await cfFetch(
      env,
      `/zones/${env.zoneId}/dns_records`,
      {
        method: "POST",
        body: JSON.stringify({
          type:    "CNAME",
          name:    hostname,
          content: `${tunnel.id}.cfargotunnel.com`,
          proxied: true,
          comment: `Marrow Library — auto-provisioned for ${licenseIdentifier}`,
        }),
      }
    );
  } catch (err) {
    // Best-effort cleanup so a partial failure doesn't leak an unusable
    // tunnel + DNS record pair that counts against the account's quota.
    try {
      await cfFetch(env, `/accounts/${env.accountId}/cfd_tunnel/${tunnel.id}`, { method: "DELETE" });
    } catch {
      /* best effort — nothing more we can do here */
    }
    throw err;
  }

  return { tunnelToken: tunnel.token, hostname };
}
