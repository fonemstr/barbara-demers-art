# Vercel Deployment Guide

Reference for deploying and re-deploying `barbara-demers-art` to Vercel.

---

## TL;DR — Re-deploying

Pick whichever fits the situation:

| Situation | Command / Action |
| --- | --- |
| You have code changes to ship | `git add -A && git commit -m "..." && git push origin main` |
| You only changed env vars and need a fresh build | Vercel → Deployments → latest → **⋯ Redeploy** |
| Nothing changed, just want to bump | `git commit --allow-empty -m "deploy bump" && git push origin main` |
| From the CLI | `pnpm dlx vercel --prod` (requires `vercel login` once) |

Pushes to `main` auto-deploy. The build command is `pnpm vercel-build`, which runs `payload migrate && next build` — migrations run on every deploy.

---

## First-time setup

1. **Push the repo to GitHub.**
2. **Import into Vercel** — framework preset is auto-detected as Next.js.
3. **Add storage integrations** from the project's **Storage** tab:
   - **Vercel Postgres** (or Neon) — sets `POSTGRES_URL` automatically.
   - **Vercel Blob** — sets `BLOB_READ_WRITE_TOKEN` automatically.
4. **Add the remaining env vars** under **Settings → Environment Variables** (see list below).
5. **Deploy.**
6. Visit `/admin` once the deploy finishes to create Barbara's Payload admin account (first-visit prompt).
7. **Register the Stripe webhook** at `https://<your-domain>/api/stripe-webhook` in the Stripe dashboard. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.
   The endpoint needs these events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.payment_failed`, `customer.updated`. The last seven keep The Budderlee Post's subscriber list in step with Stripe.
8. **Verify** with a Stripe test-mode order before switching to live keys.

---

## The Budderlee Post (subscription) setup

Before flipping the phase to **Open** in `/admin` → The Budderlee Post:

1. In Stripe, create the product "The Budderlee Post" with a recurring monthly price ($12) and the statement descriptor `BUDDERLEE POST`. Paste the price ID (`price_...`) into the settings global.
2. Under Settings → Billing → Customer portal, turn on: update payment method, update shipping address (under Customer information; it is off by default), cancel subscription at the end of the billing period (with a reason). The manage page sends subscribers there. The portal settings page has no pause option, so a pause is done by hand from the subscription's page in the Stripe dashboard; the webhook still mirrors it.
3. Make sure the webhook endpoint has the events listed above.
4. If the accountant says to collect sales tax, enable Stripe Tax in the dashboard and tick "Collect sales tax through Stripe Tax" in the settings global.
5. Test in test mode first: set the phase to Open with a test-mode price ID on a preview deployment, subscribe with card `4242 4242 4242 4242`, and check the Subscribers collection, the welcome email, and the manage link.

## Lumaprints (print-on-demand) setup

Print sizes with **Printed and shipped by Lumaprints** ticked (Paintings → Print options) are ordered from Lumaprints automatically when Stripe confirms payment. Barbara still gets the "Print sold" email, with the Lumaprints order number, or an **ACTION NEEDED** subject if the order could not be sent (she then places it by hand in the Lumaprints dashboard). There are no automatic retries, so an order is never placed twice.

**Never send a test order to the production Lumaprints API.** Lumaprints permanently revokes API access for that. `LUMAPRINTS_ENV` defaults to `sandbox`. In production, a Stripe test-mode payment is never forwarded.

1. **Sandbox first.** Register at https://sandbox.lumaprints.com, create a Standard Store, add test card `4111 1111 1111 1111` as the primary payment method, set the store's default billing address, and create an API key under Developer → API Keys. Put those keys on the **Preview** environment with `LUMAPRINTS_ENV=sandbox`.
2. Check the setup (read-only, places nothing): `node --env-file=.env.local --import tsx scripts/lumaprints-check.ts`. It prints the store IDs and confirms "0.50in Bleed" matches an option.
3. On a preview deploy, tick Lumaprints on a print size, buy it with Stripe test card `4242 4242 4242 4242`, and confirm the email shows a sandbox order number.
4. **Production.** In the live dashboard (store "Barbara J Demers", ID 9461), confirm the primary payment method and the store's default billing address (Stores → Store Settings), then create an API key. Set the production variables with `LUMAPRINTS_ENV=production` and redeploy.
5. **Tracking emails.** In the Lumaprints dashboard, Developer → Webhooks, subscribe the `shipping` event to `https://www.barbarajdemers.com/api/lumaprints-webhook` with the webhook username and password below. Buyers then get their tracking number by email.

**Print files.** Lumaprints downloads the file from a public URL. The originals in the Lumaprints image library are private, so upload each full-resolution file to the painting's print size (**Print file**). Size it for the print plus bleed: 7 × 7 in for a 6 × 6 print with 0.5 in bleed. Without one, the painting's first image is used, which may be too small; Lumaprints rejects undersized files and the email says so.

## Environment variables

### Auto-set by Vercel integrations (don't add manually)

| Variable | Source |
| --- | --- |
| `POSTGRES_URL` | Vercel Postgres / Neon integration |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob integration |

### Add manually under Settings → Environment Variables

| Variable | Value / Notes |
| --- | --- |
| `PAYLOAD_SECRET` | Long random string. Generate: `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | `sk_live_...` for prod, `sk_test_...` for preview/test |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from the Stripe dashboard webhook page (registered against the live URL) |
| `RESEND_API_KEY` | `re_...` from resend.com → API keys |
| `RESEND_FROM_EMAIL` | e.g. `Barbara Demers Studio <studio@barbarademers.com>` — sending domain must be verified in Resend |
| `RESEND_TO_EMAIL` | Where commission inquiries land (e.g. `barbara@barbarademers.com`) |
| `NEXT_PUBLIC_SITE_URL` | Production URL, no trailing slash (e.g. `https://barbarademers.com`) |
| `LUMAPRINTS_API_KEY` / `LUMAPRINTS_API_SECRET` | Lumaprints → Developer → API Keys (sandbox keys for Preview) |
| `LUMAPRINTS_STORE_ID` | Standard Store ID (`9461` in production; the sandbox store has its own) |
| `LUMAPRINTS_ENV` | `production` on Production only; anything else uses the sandbox |
| `LUMAPRINTS_SHIPPING_METHOD` | Optional, default `usps_ground_advantage` |
| `LUMAPRINTS_WEBHOOK_USERNAME` / `LUMAPRINTS_WEBHOOK_PASSWORD` | Any values; enter the same ones when subscribing the Lumaprints webhook |

### Per-environment notes

- For each variable, decide which scopes to enable: **Production**, **Preview**, **Development**.
- Use **test-mode** Stripe keys for Preview, **live** for Production.
- `NEXT_PUBLIC_SITE_URL` is baked into the build — changing it requires a redeploy.
- `.env.local` changes never affect production. Local-only.

---

## How the build works on Vercel

`vercel-build` script (in `package.json`):

```
payload migrate && next build
```

Implications:

- **Every deploy runs Payload migrations** against the production database. Be careful — a broken migration breaks the deploy.
- New collections / fields require a migration committed under the migrations folder before pushing.
- To create one locally: `pnpm migrate:create`. To apply locally: `pnpm migrate`.

---

## Image storage

- **Local dev:** filesystem under `./media/`.
- **Production:** Vercel Blob (via `BLOB_READ_WRITE_TOKEN`).
- The frontend handles both transparently — no code changes needed when switching.

---

## Content revalidation

- Public pages use ISR with a 60-second revalidate window.
- Admin edits trigger `revalidatePath` for affected public routes (so they show up faster than ISR alone).
- If something looks stale after an admin edit, wait ~60s or trigger a redeploy.

---

## Troubleshooting

### Deploy fails on `payload migrate`
- Check the deploy logs for the failing migration.
- If a migration was committed in a broken state: revert the migration commit and redeploy, then create a corrected migration locally.
- Verify `POSTGRES_URL` is set and the database is reachable from Vercel.

### `payload migrate` prompts "data loss will occur… proceed? (y/N)" and never migrates
- The database has a `batch: -1` row in `payload_migrations`, left behind by running Payload in **dev mode** against this database. The prompt can't be answered in Vercel's non-interactive build, so migrate exits without running anything — the build still shows Ready.
- Fix: baseline the database — delete the `batch = -1` row and insert a row per already-applied migration file — then redeploy. (August 2026: done via a temporary `/api/one-time-baseline-migrations` route, since removed.)
- Prevention: never point `pnpm dev` at the production `POSTGRES_URL`. Dev mode schema-syncs the database directly and re-creates the marker.

### `/admin` errors in production
- Usually `PAYLOAD_SECRET` or `POSTGRES_URL` missing. Check both are set for the Production environment.
- Check the Function logs in Vercel for the actual error.

### Stripe checkout returns an error
- `STRIPE_SECRET_KEY` missing or wrong mode (test key in production env, etc.).
- `NEXT_PUBLIC_SITE_URL` missing — used to build success/cancel URLs.

### Stripe webhook never fires / signature fails
- Webhook URL must be `https://<your-domain>/api/stripe-webhook`.
- `STRIPE_WEBHOOK_SECRET` must match the secret shown for that specific webhook endpoint in the Stripe dashboard.
- Redeploy after adding/changing the secret.

### Commission/newsletter form errors
- Missing `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, or `RESEND_TO_EMAIL`.
- Sending domain not verified in Resend (or sender not allowed).

### Images upload locally but break in production
- `BLOB_READ_WRITE_TOKEN` not set — re-add the Vercel Blob integration from the Storage tab.

### Something cached / stale after a change
- Force a redeploy from the Deployments tab to bust caches.
- Confirm the env var is set for the right environment (Production vs Preview).

---

## Useful commands

```bash
# Local dev
pnpm dev

# Clean dev (clears .next cache)
pnpm dev:clean

# Migrations
pnpm migrate            # apply pending migrations
pnpm migrate:create     # scaffold a new migration

# Build locally exactly like Vercel does
pnpm vercel-build

# Vercel CLI
pnpm dlx vercel login
pnpm dlx vercel        # deploy preview
pnpm dlx vercel --prod # deploy to production
```

---

## Pre-deploy checklist

Before pushing to `main`:

- [ ] `pnpm build` (or `pnpm vercel-build`) passes locally
- [ ] Any new Payload fields/collections have a migration committed
- [ ] New env vars (if any) are added in **Vercel → Settings → Environment Variables** for Production
- [ ] `NEXT_PUBLIC_SITE_URL` is correct (only matters if you changed domains)
- [ ] Stripe keys match the environment (live for prod, test for preview)
