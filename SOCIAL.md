# Direct Social Posting Setup

Posting to Instagram, Facebook, and Pinterest runs on the platforms' own
free APIs (`src/lib/social-direct.ts`) — no Ayrshare subscription. One-time
setup below; after it, the Payload admin flow is unchanged: compose in
**Social Posts**, set status to **Send**, save. Scheduled posts are queued
and delivered by `/api/cron/social-posts`, pinged every 15 minutes by the
`social-post-scheduler` GitHub Actions workflow.

## Environment variables (Vercel → Settings → Environment Variables, Production)

| Variable | What it is |
| --- | --- |
| `META_PAGE_ID` | Facebook Page ID |
| `META_IG_USER_ID` | Instagram Business account ID linked to that Page |
| `META_PAGE_ACCESS_TOKEN` | Long-lived Page access token (does not expire) |
| `PINTEREST_APP_ID` / `PINTEREST_APP_SECRET` | Pinterest app credentials |
| `PINTEREST_REFRESH_TOKEN` | OAuth refresh token (valid ~1 year; access tokens are minted from it at send time) |
| `PINTEREST_BOARD_ID` | Board that receives pins |
| `CRON_SECRET` | Any random string; same value goes in the GitHub repo secret `CRON_SECRET` |

Missing variables never crash a save — the affected platform reports
`FAILED (…not set)` in the post's delivery report.

## Meta (Facebook + Instagram) — one app covers both

Prerequisite: the Instagram account must be a **Business or Creator**
account linked to the Facebook Page (Meta Business Suite → Settings →
Linked accounts).

1. Create an app at https://developers.facebook.com → type **Business**.
2. Add the **Facebook Login for Business** product (default settings are fine).
3. Open **Graph API Explorer** (Tools menu): select the app, click
   **Generate Access Token**, and grant these permissions:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
   `instagram_basic`, `instagram_content_publish`, `business_management`.
4. Exchange that short-lived token for a long-lived one (App Dashboard →
   Tools → **Access Token Debugger** → *Extend Access Token*).
5. With the extended token in Graph API Explorer, request
   `GET /me/accounts` — copy the Page's `id` (`META_PAGE_ID`) and the
   Page's own `access_token` (`META_PAGE_ACCESS_TOKEN`; Page tokens
   obtained from a long-lived user token do not expire).
6. Request `GET /{page-id}?fields=instagram_business_account` — the `id`
   inside is `META_IG_USER_ID`.

The app can stay in Development mode: posting to assets you own (your own
Page and IG account) works without App Review.

## Pinterest

1. Create an app at https://developers.pinterest.com/apps/ (trial access is
   fine for posting to your own account) — note the **App ID** and secret.
2. Add `https://localhost/` as a redirect URI.
3. Authorize once in a browser:
   `https://www.pinterest.com/oauth/?client_id=APP_ID&redirect_uri=https://localhost/&response_type=code&scope=boards:read,pins:read,pins:write`
   — after approving, copy the `code` from the address bar.
4. Exchange it (within a few minutes):
   ```bash
   curl -X POST https://api.pinterest.com/v5/oauth/token \
     -u 'APP_ID:APP_SECRET' \
     -d 'grant_type=authorization_code' \
     -d 'code=THE_CODE' \
     -d 'redirect_uri=https://localhost/'
   ```
   Save the `refresh_token` from the response as `PINTEREST_REFRESH_TOKEN`.
5. `GET https://api.pinterest.com/v5/boards` (with the access token from the
   same response) lists boards — copy the target board's `id` as
   `PINTEREST_BOARD_ID`.

Refresh tokens expire after about a year; when posts start failing with
`token refresh failed`, redo steps 3–4.

## Scheduler

- Set `CRON_SECRET` in Vercel **and** as a GitHub Actions repository secret
  (Repo → Settings → Secrets and variables → Actions):
  ```bash
  gh secret set CRON_SECRET
  ```
- The workflow `.github/workflows/social-cron.yml` calls
  `GET /api/cron/social-posts` every 15 minutes; a post scheduled for
  6:00 PM goes out by ~6:15 PM at the latest. Run it manually from the
  Actions tab (workflow_dispatch) to test.

## What changed vs Ayrshare

- X (Twitter) and TikTok options were removed — neither was connected, and
  TikTok's API requires a formal app review.
- Scheduling now lives in this repo (Payload stores the time, the cron
  delivers), so it no longer depends on any third-party plan tier.
- The footer's social links still try Ayrshare's profile API while the key
  works and fall back to the hardcoded list in `src/lib/ayrshare.ts`.
