# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3001
npm run build        # Production build
npm run type-check   # Run tsc --noEmit (has pre-existing errors — see below)
```

The dev server runs on **port 3001** (not 3000) — set in `package.json`.

> **Type-check note:** `npm run type-check` reports pre-existing errors across API routes and components (`next/server`, `@types/node`, JSX IntrinsicElements). These errors existed before any changes and do not block Vercel builds. Don't treat them as regressions from new code.

## Architecture

### Homepage is static HTML, not a React page
The root route (`/`) is served as `/public/index.html` — a ~1700-line self-contained static file with embedded CSS and JS. This is wired via `next.config.js`:

```js
async rewrites() {
  return { beforeFiles: [{ source: '/', destination: '/index.html' }] };
}
```

All landing page content, feature lists, FAQ, pricing card, and animations live in `public/index.html`. There is no React component for the homepage.

### Pages (React/Next.js)
- `src/app/download/page.tsx` — download page, fetches GitHub releases via API with fallback to hardcoded stable version
- `src/app/success/page.tsx` — post-purchase page: retrieves Stripe session, generates HMAC license key, sends email
- `src/app/not-found.tsx` — 404 page with navigation cards

### Licensing (`src/lib/license.ts`)
HMAC-SHA256 license keys. Format: `base64url(JSON).hexhmac`

- `generateLicenseKey(payload, secret)` — creates a signed key
- `validateLicenseKey(key, secret)` — validates and returns tier/expiry; uses timing-safe compare
- Tiers: `FREE` (50-item limit), `COLLECTOR` (unlimited + valuations + backup), `CURATOR` (all features)
- Billing periods: `launch` = 90 days, `monthly` = 31 days, `annual` = 365 days, `lifetime` = no expiry

### Checkout flows
Two paths to Stripe checkout:
1. **`/api/checkout-with-profile`** (POST, preferred) — email-first, upserts Stripe Customer, returns `{ url }`. Prices: launch=$20, monthly=$5.99, annual=$49, lifetime=$79.
2. **`/api/checkout`** (GET) — quick redirect, query params `?tier=COLLECTOR&billing=launch`

### Email delivery (`src/lib/mailer.ts`)
Primary path is **Nodemailer SMTP** (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`). `src/lib/resend.ts` exists but is not the primary email path. License emails are sent from `success/page.tsx` (on page load after purchase) and from `src/app/api/webhook/route.ts` (on `checkout.session.completed` event).

### Downloads (`/api/download/premium`)
License-gated download redirect. Fetches latest GitHub release from `fullstackdeveloper829-creator/marrow-library`, falls back to hardcoded stable version (`STABLE_VERSION` in `download/page.tsx` and the API route). Platforms: `macos`, `windows`, `android`.

## Required Environment Variables

```
MARROW_LICENSE_SECRET      # 32+ char HMAC secret for license signing
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY             # Resend client (instantiated, not primary email path)
NEXT_PUBLIC_SITE_URL       # e.g. https://marrowlibrary.app

# SMTP (primary email)
SMTP_HOST
SMTP_PORT
SMTP_SECURE                # "true" for TLS
SMTP_USER
SMTP_PASS
SMTP_FROM                  # defaults to noreply@marrowlibrary.app
```

## Pricing Model

Download free → try app free → pay **$20 once** for 3 months of full access → free basic tier forever after. The landing page copy must reflect "trial-first" messaging (free trial is the primary CTA; purchase is secondary).
