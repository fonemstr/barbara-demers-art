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

## Meta (Facebook + Instagram): one app covers both

Current setup (September 2026): app **Barbara J Demers Studio**, created
under Barbara's Facebook login. The steps below are what actually worked;
Meta's dashboard has moved to a "use case" model, so older guides that
mention app types no longer match.

### Prerequisite: link Instagram to the Page inside the business portfolio

This is the step that costs hours if skipped. The Instagram account must be
a professional (Business or Creator) account **and** joined to the Page
inside the business portfolio that owns the Page. Connecting the two through
Accounts Center is not enough: the API then reports the account as
`connected_instagram_account` but never as `instagram_business_account`, and
every publish call fails with
`(#10) Requires instagram_content_publish permission` even though the
permission is granted.

1. Meta Business Suite → Settings → Accounts → **Instagram accounts** →
   Add, and log into Instagram.
2. Settings → Accounts → **Pages** → select the Page → **Connect assets** →
   Instagram account → **Confirm connection** (logs into Instagram again).
   A "Verification Required" new-device prompt can interrupt this once;
   dismiss it, refresh, and repeat.
3. Check: `GET /{page-id}?fields=instagram_business_account` with a Page
   token must return the account.

### App and permissions

1. https://developers.facebook.com → Create app. Pick the use cases
   **Manage everything on your Page** and **Manage messaging & content on
   Instagram** (both under the "Content management" filter). A business
   portfolio is optional and can be skipped.
2. App dashboard → Use cases → **Customize** each one → *Permissions and
   features* → Add: `pages_manage_posts` and `pages_read_engagement` on the
   Page use case, `instagram_basic` and `instagram_content_publish` on the
   Instagram use case. (`pages_show_list` and `business_management` are there
   by default.) The Graph API Explorer only offers permissions added here.

### Tokens

1. **Graph API Explorer** (Tools menu): select the app, add the six
   permissions, click **Generate Access Token**, and approve the popup with
   the Page and the Instagram account selected.
2. Click the small info icon beside the token → **Open in Access Token
   Tool** → **Extend Access Token**. Do this with the *User* token selected,
   not a Page token: extending a Page token only buys 60 days.
3. Paste the long-lived user token into the Explorer's token box, then pick
   the Page in the **User or Page** dropdown. The box now holds the Page
   token, which never expires (its info popup shows no expiration row). That
   value is `META_PAGE_ACCESS_TOKEN`.
4. `GET /me/accounts` gives the Page `id` (`META_PAGE_ID`);
   `GET /{page-id}?fields=instagram_business_account` gives
   `META_IG_USER_ID`.
5. Read-only health check: `GET /{ig-user-id}/content_publishing_limit`
   should return quota data rather than an error.

The app can stay in Development mode: posting to assets you own works
without App Review.

## Pinterest

1. Create an app at https://developers.pinterest.com/apps/ and note the
   **App ID**. The form requires a privacy policy URL
   (https://www.barbarajdemers.com/privacy). Pinterest then reviews the
   request; the app secret stays hidden until trial access is approved,
   which took about two weeks.
2. Add `https://www.barbarajdemers.com/api/pinterest/callback` as a redirect
   URI (and `http://localhost:3000/api/pinterest/callback` for local testing).
3. Signed in to the Payload admin, open `/api/pinterest/connect`. It sends
   you to Pinterest's consent screen; after **Give access** you land on a
   "Pinterest connected" page showing the account and its boards.
4. First time only: expand **Refresh token** on that page, save it in Vercel
   as `PINTEREST_REFRESH_TOKEN`, set `PINTEREST_BOARD_ID` to the ID listed
   beside the target board, and redeploy.

Refresh tokens expire after about a year; when posts start failing with
`token refresh failed`, redo steps 3–4.

**Trial access posts only to the sandbox.** Pinterest rejects pins from
Trial apps on the production API ("use API Sandbox"). Until the app has
Standard access:

1. On the app page at https://developers.pinterest.com/apps/, generate a
   **Sandbox token** (valid 30 days) and save it in Vercel as
   `PINTEREST_SANDBOX_TOKEN`.
2. Sandbox boards are separate from real ones. Create one:
   ```bash
   curl -X POST https://api-sandbox.pinterest.com/v5/boards \
     -H "Authorization: Bearer SANDBOX_TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"name": "Barbara Demers Art"}'
   ```
   Save the `id` from the response as `PINTEREST_SANDBOX_BOARD_ID`, then redeploy.

Sandbox pins are visible only to the account owner, on their own profile.
Once Standard access is approved (Upgrade access on the app page; the
review wants a video of the connect flow and a pin being posted), delete
`PINTEREST_SANDBOX_TOKEN` and redeploy to post publicly again.

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
- A scheduled post found more than 24 hours after its time is marked
  Failed ("Missed window") instead of being sent, so stale rows can never
  repeat old content. Set a new time and choose Send to post it.

## What changed vs Ayrshare

- X (Twitter) and TikTok options were removed — neither was connected, and
  TikTok's API requires a formal app review.
- Scheduling now lives in this repo (Payload stores the time, the cron
  delivers), so it no longer depends on any third-party plan tier.
- The footer's social links are a plain list in `src/lib/social-profiles.ts`.
- Every send goes through `src/lib/social-delivery.ts`, which pads tall or
  wide images for Instagram and leaves the original for the other platforms.
