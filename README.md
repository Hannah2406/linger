# Linger

A shopping cooldown app. Add the things you want, wait a week, then decide.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** — Postgres, Auth, Storage
- **Resend** — transactional email
- **Vercel** — hosting + Cron + `@vercel/og` share cards
- **Cheerio** — Open Graph + JSON-LD scraping

## What's built (v1 scope)

- Email + Google sign-in (Supabase Auth)
- URL paste flow with multi-tier extraction (Shopify JSON → universal OG / JSON-LD → manual fallback)
- In-store photo flow (camera capture, private Storage upload)
- 24h / 3d / 7d / 14d / custom cooldowns (default 7d online, 3d in-person)
- Active cooldowns list, savings counter w/ real-life-equivalent translation
- Decision moment screen (yes / no / wait longer) with confetti + share card
- Override flow with a soft confirmation
- Archive (no-thanks + bought tabs)
- Settings (defaults, notifications, export, sign-out, delete)
- "Bored or shopping?" check-in (once per day)
- Hourly cooldown-expiry cron + cooldown-ended email
- Daily price-tracking cron + price-drop / low-stock email
- `@vercel/og` share card endpoint at `/api/share-card`
- Data export to JSON

## What you have to do (one-time setup)

The code is here, but a few setup steps need your hands:

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → create a new project (free tier).
2. In the **SQL Editor**, paste and run [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql).
3. In **Storage**, create a bucket called `item-photos` and set it to **private**. Then run the storage policies at the bottom of the migration file in the SQL editor.
4. (Optional, for Google sign-in) In **Authentication → Providers**, enable Google. Set the redirect URL to `https://your-domain.com/auth/callback` (and `http://localhost:3000/auth/callback` for dev).

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase → Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — same page (keep secret, server-only)
- `RESEND_API_KEY` — [resend.com](https://resend.com) (skip in dev — emails log to console)
- `RESEND_FROM` — must use a domain you've verified in Resend
- `CRON_SECRET` — any random string. Vercel auto-sends `Authorization: Bearer ${CRON_SECRET}` to cron paths.

### 3. Run it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and paste your first link.

### 4. Deploy to Vercel

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new), or:

```bash
npx vercel
```

In Vercel **Settings → Environment Variables**, add all the env vars above. Cron jobs in [`vercel.json`](vercel.json) run automatically once deployed.

## Project structure

```
app/
  page.tsx              landing page
  login/                sign-in + sign-up
  auth/callback/        OAuth callback
  (app)/                auth-gated routes
    home/               savings counter + active cooldowns
    add/                URL paste + photo flows
    items/[id]/         item detail + decision moment
    archive/            no-thanks + bought tabs
    settings/           preferences, export, sign-out
  api/
    items/              CRUD + extract-url + upload-photo
    stats/              savings counter data
    profile/            user preferences
    checkin/            daily "bored or shopping?" prompt
    export/             full JSON export
    share-card/         @vercel/og share image
    cron/
      check-cooldowns/  hourly: mark expired + send emails
      check-prices/     daily: re-scrape prices + alerts
components/
  shell/                tab bar, page header
  home/                 item card, check-in prompt
  add/                  item form
lib/
  supabase/             client / server / middleware factories
  scraping/             dispatch + og + shopify extractors
  email/                Resend client + templates
  translations.ts       money → real-life-equivalent
  format.ts             money + date helpers
  types.ts              shared TS types
supabase/migrations/    SQL for initial schema + RLS
middleware.ts           refresh sessions + redirect logic
vercel.json             cron schedule
```

## What you might want to build next

The spec has a clear "v2 backlog" — friend voting, secondhand integration, browser extension, native mobile, multi-currency. Don't start any of them until you've used v1 for a month and friends have given feedback.

Site-specific extractors (Amazon, Sephora, Lululemon) are stubbed — `lib/scraping/dispatch.ts` already has the dispatcher pattern; add files in `lib/scraping/extractors/` and route based on hostname when the universal extractor isn't enough.

## Voice + design notes

The app is intentionally warm and non-judgmental. Re-read the spec's "Copy and voice" section before you change microcopy. Never moralize. Every "no thanks" is celebrated; every "yes" is neutral.

Palette is in [`app/globals.css`](app/globals.css) as CSS variables — change in one place to retheme. Fonts are Inter (sans) + Fraunces (serif headings).
