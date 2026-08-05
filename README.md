# Barbara J Demers Art

Portfolio + shop site for Barbara J Demers, a painter of animal subjects. Built with Next.js 16 (App Router, React 19), Tailwind CSS v4, Stripe Checkout, and Resend for transactional email. Paintings are defined in a typed data file so adding inventory is a quick code edit today; the data model is shaped so this can be swapped for a CMS later without touching the UI.

## Stack

- **Next.js 16** (App Router, React 19)
- **Tailwind CSS 4** with `@tailwindcss/typography`
- **Fraunces** (serif) + **Inter** (sans) via `next/font`
- **Payload CMS 3** — embedded admin at `/admin` for paintings + journal posts
- **Postgres** via `@payloadcms/db-postgres` (Neon / Vercel Postgres)
- **Vercel Blob** for image storage in production (local filesystem in dev)
- **Stripe Checkout** for purchases, plus a webhook for sale notifications
- **Resend** for commission inquiries + newsletter signups
- **MDX** blog (`content/blog/*.mdx`) as a fallback when Payload is not connected

## Local setup

```bash
pnpm install
cp .env.local.example .env.local   # then fill in keys
pnpm dev
```

Open <http://localhost:3000>.

### Environment variables

| Key | Required? | Notes |
| --- | --- | --- |
| `PAYLOAD_SECRET` | for admin | Any long random string. `openssl rand -base64 32` is fine. |
| `POSTGRES_URL` | for admin | Postgres connection string. Free tier on <https://neon.tech>. |
| `BLOB_READ_WRITE_TOKEN` | production | Vercel Blob token for uploaded images. Local dev uses filesystem. |
| `STRIPE_SECRET_KEY` | for checkout | Use `sk_test_...` during development. |
| `STRIPE_WEBHOOK_SECRET` | for sale webhook | Get via `stripe listen --forward-to localhost:3000/api/stripe-webhook`. |
| `RESEND_API_KEY` | for commissions + newsletter | <https://resend.com/api-keys> |
| `RESEND_FROM_EMAIL` | for commissions + newsletter | Must be a verified sender on Resend. |
| `RESEND_TO_EMAIL` | for commissions + newsletter | Where inquiries land — Barbara's inbox. |
| `NEXT_PUBLIC_SITE_URL` | in production | Used as the origin for Stripe success/cancel URLs. |

Graceful fallbacks:

- **No `POSTGRES_URL`** — gallery reads from the static seed in `src/data/paintings.ts` and the journal reads from `content/blog/*.mdx`. The `/admin` route will error. This lets you run the site with zero database setup.
- **No Stripe keys** — the Buy button returns an error; the rest of the site works.
- **No Resend keys** — the commission + newsletter forms return an error; the rest of the site works.

## The admin (Payload)

Once `PAYLOAD_SECRET` and `POSTGRES_URL` are set, visit <http://localhost:3000/admin>. The first visit prompts you to create an admin user — use Barbara's email and any password; it's stored hashed in Postgres.

Collections:

- **Paintings** — title, slug, subject, year, medium, dimensions, price (cents), size tier, description, images, print options (giclée sizes + prices), featured, sold
- **Journal Posts** — title, slug, excerpt, cover, rich-text body, status (draft/published), publishedAt
- **Media** — uploaded image files; used by Paintings and Journal Posts
- **Users** — admin logins; only Barbara (and David) should have accounts

Image uploads land on the local filesystem in dev (`./media/`) and on Vercel Blob in production. The frontend picks up both automatically.

### Seeding from code (optional)

There's no auto-seed yet. When Barbara logs in for the first time she can add her paintings directly. The sample paintings in `src/data/paintings.ts` are a **development fallback**, not a migration — they render only when Postgres is not connected.

## Adding a new painting (without the admin)

If you'd rather skip Payload and manage inventory in code, edit `src/data/paintings.ts`. Each entry looks like:

```ts
{
  slug: "red-fox-in-winter",
  title: "Red Fox in Winter",
  subject: "Red fox",
  year: 2026,
  medium: "Oil on canvas",
  widthIn: 24,
  heightIn: 30,
  priceCents: 145_000,     // $1,450
  sizeTier: "large",       // drives shipping rate
  featured: true,          // appears on the home page
  description: "...",
  images: ["/paintings/red-fox-in-winter.jpg"],
}
```

1. Drop the hi-res image(s) into `public/paintings/`.
2. Add the object to the `paintings` array.
3. Commit & push — Vercel will redeploy.

`sizeTier` maps to flat-rate shipping in `SHIPPING_RATES` at the top of the same file. Adjust those to match what Barbara actually pays to pack and ship.

### Marking a painting as sold

Two options:
- **Manual:** set `sold: true` on the painting in `src/data/paintings.ts` (or tick the checkbox in `/admin`). The gallery card will show a `Sold` badge and the detail page hides the Buy button.
- **Automatic (needs a DB):** the Stripe webhook at `/api/stripe-webhook` receives `checkout.session.completed` events and marks the painting sold in Payload, revalidating the affected pages. Print sales never mark the original sold.

## Giclée prints

Each painting can offer archival giclée prints in any number of sizes — set them per painting in `/admin` under **Print options**, or in code via the `prints` array (`id`, `widthIn`, `heightIn`, `priceCents`). Prints:

- stay purchasable after the original sells (a sold painting with print options keeps earning);
- show a size picker + buy button on the painting detail page, and "Prints from $X" on gallery cards;
- ship at a flat rate (`PRINT_SHIPPING_RATE` in `src/data/paintings.ts`), with quantity adjustable in Stripe Checkout;
- trigger a "Print sold" email to the studio via the Stripe webhook, including size and ship-to address, without touching the original's availability.

Fulfillment is manual by design to start: when the email arrives, order the print from a local fine-art print shop (or print in-studio) and ship it. A print-on-demand API can be wired into the webhook later without changing the storefront.

## Adding a blog post

Create a file in `content/blog/`:

```mdx
---
title: Studio notes, April
date: 2026-04-18
excerpt: A line or two for the index page.
cover: /paintings/some-image.jpg
---

Body written in MDX.
```

The journal index and individual post routes pick it up automatically on the next build.

## Stripe test flow

```bash
# Terminal 1
pnpm dev

# Terminal 2 — forwards Stripe events into the local app
stripe login
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Copy the `whsec_...` the CLI prints into `STRIPE_WEBHOOK_SECRET`, restart `pnpm dev`, and go to any available painting's detail page. Use card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP. You'll land back on `/checkout/success` and the terminal running `stripe listen` will log the event.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import into Vercel — framework preset is auto-detected.
3. From the project's **Storage** tab, add both:
   - **Vercel Postgres** — sets `POSTGRES_URL` automatically.
   - **Vercel Blob** — sets `BLOB_READ_WRITE_TOKEN` automatically.
4. Under **Settings → Environment Variables**, add the remaining keys from `.env.local.example` (`PAYLOAD_SECRET`, Stripe, Resend, `NEXT_PUBLIC_SITE_URL`).
5. Deploy. Visit `/admin` once live to create Barbara's admin account.
6. Register a webhook at `https://your-domain.com/api/stripe-webhook` in the Stripe dashboard. Copy the signing secret into Vercel's `STRIPE_WEBHOOK_SECRET` and redeploy.
7. Verify a test order with Stripe test mode before switching to live keys.

## Project structure

```
src/
  app/
    layout.tsx           # shell with header/footer
    page.tsx             # home (hero + featured + newsletter)
    gallery/
      page.tsx           # all paintings grid
      [slug]/page.tsx    # painting detail + Buy button
    commissions/page.tsx # commission inquiry form
    about/page.tsx       # artist bio
    blog/
      page.tsx           # journal index
      [slug]/page.tsx    # MDX post renderer
    checkout/success/page.tsx
    api/
      checkout/route.ts       # creates Stripe Checkout Session
      stripe-webhook/route.ts # receives Stripe events
      commissions/route.ts    # emails Barbara via Resend
      newsletter/route.ts     # emails Barbara via Resend
  components/             # painting card, forms, buy button
  data/paintings.ts       # the catalog + shipping tiers
  lib/                    # stripe, resend, blog, utils
content/blog/             # MDX posts
public/paintings/         # painting images (placeholders today)
```

## Next steps (not built yet)

- Persistence layer so the Stripe webhook can automatically flip paintings to sold without a code change
- Multi-image carousels on the painting detail page
- Sitemap + proper OG images
- CMS migration (Payload or Sanity) once the catalog outgrows manual TypeScript editing
- Proper photography to replace the placeholder SVGs in `public/paintings/`
