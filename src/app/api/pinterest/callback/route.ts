import { getPayload } from "payload";
import config from "@payload-config";
import { adminFromRequest } from "@/lib/budderlee-post-fulfillment";
import {
  PINTEREST_API,
  STATE_COOKIE,
  basicAuth,
  callbackUrl,
  escapeHtml,
  page,
} from "@/lib/pinterest-oauth";

// Pinterest redirects here after the owner approves (or declines) the app.
// Exchanges the code, then shows the connected account and its boards. The
// refresh token stays collapsed so it never appears on screen by default.

type TokenResponse = { access_token?: string; refresh_token?: string; scope?: string; message?: string };
type Account = { username?: string; profile_image?: string };
type Boards = { items?: { id: string; name: string }[] };

function failure(message: string, status = 400): Response {
  return page(
    "Pinterest not connected",
    `<h1 class="bad">✕ Pinterest not connected</h1><p>${escapeHtml(message)}</p><a class="btn" href="/api/pinterest/connect">Try again</a>`,
    status,
  );
}

export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config });
  if (!(await adminFromRequest(payload, request))) {
    return Response.redirect(new URL("/admin/login", request.url), 302);
  }

  const params = new URL(request.url).searchParams;
  if (params.get("error")) return failure("Access was not granted on Pinterest.");

  const cookieState = request.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);
  const code = params.get("code");
  if (!code || !cookieState || params.get("state") !== cookieState) {
    return failure("This sign-in link expired or didn't start here. Start again from Connect Pinterest.");
  }

  const auth = basicAuth();
  if (!auth) return failure("PINTEREST_APP_ID / PINTEREST_APP_SECRET not set.", 500);

  const tokenRes = await fetch(`${PINTEREST_API}/oauth/token`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(request),
    }),
  });
  const token = (await tokenRes.json().catch(() => ({}))) as TokenResponse;
  if (!tokenRes.ok || !token.access_token) {
    return failure(`Pinterest rejected the code: ${token.message ?? `HTTP ${tokenRes.status}`}`, 502);
  }

  const headers = { Authorization: `Bearer ${token.access_token}` };
  const [account, boards] = await Promise.all([
    fetch(`${PINTEREST_API}/user_account`, { headers }).then((r) => r.json() as Promise<Account>).catch((): Account => ({})),
    fetch(`${PINTEREST_API}/boards?page_size=50`, { headers }).then((r) => r.json() as Promise<Boards>).catch((): Boards => ({})),
  ]);

  const targetBoard = process.env.PINTEREST_BOARD_ID;
  const boardList = (boards.items ?? [])
    .map(
      (b) =>
        `<li>${escapeHtml(b.name)} <code>${escapeHtml(b.id)}</code>${b.id === targetBoard ? '<span class="tag">new pins go here</span>' : ""}</li>`,
    )
    .join("");

  const avatar = account.profile_image
    ? `<img src="${escapeHtml(account.profile_image)}" alt="">`
    : "";
  const refresh = token.refresh_token
    ? `<details><summary>Refresh token (for Vercel)</summary><p>Save as <code>PINTEREST_REFRESH_TOKEN</code> in Vercel, then redeploy. Only needed when connecting for the first time or after the old token expires (about a year).</p><p><code>${escapeHtml(token.refresh_token)}</code></p></details>`
    : "";

  const body = `
    <h1 class="ok">✓ Pinterest connected</h1>
    <p>Barbara Demers Art can now publish pins to this account. New paintings and social posts will be pinned automatically, linking back to the gallery.</p>
    <div class="account">${avatar}<strong>@${escapeHtml(account.username ?? "your account")}</strong></div>
    <p><strong>Permissions granted:</strong> ${escapeHtml((token.scope ?? "").split(/[ ,]+/).filter(Boolean).join(", ") || "boards, pins")}</p>
    ${boardList ? `<p><strong>Boards</strong></p><ul>${boardList}</ul>` : ""}
    <a class="btn" href="/admin/collections/social-posts">Back to Social Posts</a>
    ${refresh}`;

  const res = page("Pinterest connected", body);
  res.headers.append("Set-Cookie", `${STATE_COOKIE}=; Path=/api/pinterest; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  return res;
}
