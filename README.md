# Marrow Library — marketing site

Next.js 14 (App Router) marketing site for Marrow Library. The live homepage is
served from `public/index.html` (rewritten from `/` in `next.config.js`), not
`src/app/page.tsx`. Purchases are currently disabled — `/api/checkout`
redirects to the waitlist section, and signups are the primary conversion
path until checkout reopens.

## Development

```bash
npm install
npm run dev          # http://localhost:3001
npm run type-check
npm run build
```

## Waitlist signups

`src/app/api/notify/route.ts` handles the "notify me" form
(`src/components/NotifyForm.tsx`). On each signup it:

1. Logs the signup (Vercel function logs — short retention, not durable).
2. Inserts the signup into Supabase (`signups` table) when `SUPABASE_URL`
   and `SUPABASE_ANON_KEY` are set — this is the durable record.
3. Emails the site owner via Resend when `RESEND_API_KEY` is set, and
   optionally adds the contact to a Resend Audience when
   `RESEND_AUDIENCE_ID` is set.

The Supabase `signups` table has row-level security enabled with an
insert-only policy for the `anon` role, so the public anon key can add
signups but cannot read, update, or delete them.

## Environment variables

See `.env.example`. Required for waitlist storage: `SUPABASE_URL`,
`SUPABASE_ANON_KEY`. Required for checkout/licensing once enabled:
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `MARROW_LICENSE_SECRET`,
`RESEND_API_KEY`.

## Deployment

Deployed on Vercel, auto-deploying from `master`.
