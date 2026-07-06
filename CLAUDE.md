# CLAUDE.md

This file gives Claude Code guidance for working in this repository.

## Project overview

`marrow-site` is the marketing/sales site for **Marrow Library** ("Catalog
Your Collection"), a desktop app for cataloging personal collections. This
repo is deployed to Vercel at `marrow-site.vercel.app`.

**Important quirk: the live homepage is static HTML, not the Next.js app.**
`next.config.js` rewrites `/` to `/index.html`, so `public/index.html`
(the real, hand-authored landing page) is what actually serves visitors at
the root. `src/app/page.tsx` is a deliberate no-op stub (`return null`)
that exists only to satisfy the Next.js App Router build requirement — see
git history commit `feat: replace Next.js frontend with static HTML` for
why. **When asked to edit "the homepage" or "the landing page," edit
`public/index.html`, not `src/app/page.tsx`.**

There is also a `marrow-library.html` file at the repo root — this is an
**orphaned draft/alternate version** of the landing page, not referenced by
any code or config. Don't confuse it with `public/index.html`; if asked to
update the live site, don't edit this file unless explicitly told to.

The rest of the Next.js app handles a real, functional purchase flow:
Stripe checkout, license-key generation/validation, and transactional email.

## Tech stack

- **Next.js 14.2.29** (App Router) + **React 18.3.1**, **TypeScript 5.4.5**
  (strict mode, `moduleResolution: bundler`, path alias `@/*` → `./src/*`).
- **Tailwind CSS 4.3** via `@tailwindcss/postcss`.
- **Zod** for validation, **Stripe** for payments, **Resend** (+ Nodemailer)
  for transactional email.
- Deployed on **Vercel** (`vercel.json`: `framework: nextjs`, standard
  build/install commands).
- No test framework and no ESLint config are set up in this repo.

## Commands

- `npm run dev` — dev server on **port 3001** (not the Next.js default 3000).
- `npm run build` — production build.
- `npm run start` — serve the production build, also on port 3001.
- `npm run type-check` — `tsc --noEmit`. Run this before considering a
  TypeScript change done; there is no separate lint script and no CI, so
  this is the only automated check available.

## Directory structure

```
src/app/
  layout.tsx, page.tsx (stub — see above), not-found.tsx, globals.css
  robots.ts, sitemap.ts          # dynamic SEO routes
  download/page.tsx
  privacy/page.tsx
  refund/page.tsx
  success/page.tsx
  terms/page.tsx
  api/
    auth/verify-email/route.ts
    checkout/route.ts
    checkout-with-profile/route.ts
    download/premium/route.ts
    license/validate/route.ts
    send-license/route.ts
    test-email/route.ts
    webhook/route.ts             # Stripe webhook handler
src/lib/
  license.ts    # license-key generation/validation, keyed by MARROW_LICENSE_SECRET
  mailer.ts     # transactional email sending
  resend.ts     # Resend client setup
  stripe.ts     # Stripe client setup
public/
  index.html            # the REAL live landing page
  marrow-site.svg, llms.txt, robots.txt, sitemap.xml, Google Search Console
  verification file
scripts/
  check-email.mjs       # manual diagnostic: lists/creates the production
                         # Stripe webhook (hardcoded to
                         # https://marrow-site.vercel.app/api/webhook) and
                         # sends a Resend test email; loads .env.local itself,
                         # run with `node scripts/check-email.mjs`
```

This is App Router only — there is no `pages/` directory. New routes go
under `src/app/`.

## Purchase / licensing flow

The API routes implement: Stripe Checkout → webhook confirms payment →
license key generated (`src/lib/license.ts`, secret from
`MARROW_LICENSE_SECRET`) → license emailed via Resend/Nodemailer → customer
can validate/download from `license/validate` and `download/premium`.
When touching any of these routes, keep the webhook signature verification
(`STRIPE_WEBHOOK_SECRET`) and license-secret handling intact — this is real
payment infrastructure, not a demo.

## Environment variables

Defined in `.env.example` — copy to `.env.local` for local dev:

- `MARROW_LICENSE_SECRET` — secret used to sign/verify license keys.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL` — defaults to `http://localhost:3001`

Never commit real values for these; `.gitignore` already excludes
`.env*.local` and `.env*`.

## Existing `.claude/` setup

`.claude/launch.json` defines a debugger launch config named `marrow-html`
that serves the repo root via `npx serve -p 4321 .` — useful for previewing
`marrow-library.html`/static assets directly, separate from `npm run dev`.

## SEO / content work

Recent history shows heavy SEO iteration on `public/index.html`: structured
data (JSON-LD), `llms.txt`, `robots.txt`/`sitemap.xml`, hreflang tags for 9
locales, and Google Search Console verification. If asked to make SEO or
copy changes to the live site, that work happens in `public/index.html`,
and metadata routes (`src/app/robots.ts`, `src/app/sitemap.ts`) if the
change is scoped to the Next.js side (e.g., app-router pages like
`/privacy`, `/terms`).
