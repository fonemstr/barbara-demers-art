// Pinterest OAuth connect flow for the site owner. /api/pinterest/connect
// sends a signed-in admin to Pinterest's consent screen; Pinterest returns to
// /api/pinterest/callback, which exchanges the code and shows the connected
// account. The refresh token it yields is what PINTEREST_REFRESH_TOKEN holds
// (see SOCIAL.md); social-direct.ts mints access tokens from it at send time.

export const PINTEREST_API = "https://api.pinterest.com/v5";
export const PINTEREST_SCOPES = ["boards:read", "pins:read", "pins:write", "user_accounts:read"];
export const STATE_COOKIE = "pinterest_oauth_state";

/** Must match a redirect URI registered on the Pinterest app exactly. */
export function callbackUrl(request: Request): string {
  return `${new URL(request.url).origin}/api/pinterest/callback`;
}

export function basicAuth(): string | null {
  const appId = process.env.PINTEREST_APP_ID;
  const secret = process.env.PINTEREST_APP_SECRET;
  if (!appId || !secret) return null;
  return `Basic ${Buffer.from(`${appId}:${secret}`).toString("base64")}`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A small standalone page in the site's palette, for the callback's outcomes. */
export function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} · Barbara Demers Art</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; font: 16px/1.5 system-ui, -apple-system, sans-serif; background: #f7f4ef; color: #2a2723; }
  main { max-width: 560px; margin: 0 auto; padding: 48px 16px; }
  .card { background: #fff; border: 1px solid #e6e0d6; border-radius: 12px; padding: 28px; }
  h1 { font-size: 1.5rem; margin: 0 0 8px; display: flex; align-items: center; gap: 10px; }
  .ok { color: #1f7a4d; } .bad { color: #b3261e; }
  .account { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .account img { width: 48px; height: 48px; border-radius: 50%; }
  ul { padding-left: 20px; } li { margin: 4px 0; }
  .tag { font-size: .75rem; background: #e7f3ec; color: #1f7a4d; border-radius: 999px; padding: 2px 8px; margin-left: 6px; }
  code { background: #f2eee7; border-radius: 4px; padding: 1px 5px; font-size: .85em; word-break: break-all; }
  details { margin-top: 20px; font-size: .9rem; color: #5c564e; }
  .btn { display: inline-block; margin-top: 20px; background: #2a2723; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px; }
</style>
</head>
<body><main><div class="card">${body}</div></main></body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
