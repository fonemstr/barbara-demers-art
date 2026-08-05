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
8. **Verify** with a Stripe test-mode order before switching to live keys.

---

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
