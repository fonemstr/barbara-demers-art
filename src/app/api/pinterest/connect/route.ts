import { randomBytes } from "node:crypto";
import { getPayload } from "payload";
import config from "@payload-config";
import { adminFromRequest } from "@/lib/budderlee-post-fulfillment";
import { PINTEREST_SCOPES, STATE_COOKIE, callbackUrl, page } from "@/lib/pinterest-oauth";

// Starts the Pinterest OAuth flow for the signed-in admin.

export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config });
  if (!(await adminFromRequest(payload, request))) {
    return Response.redirect(new URL("/admin/login", request.url), 302);
  }

  const appId = process.env.PINTEREST_APP_ID;
  if (!appId) {
    return page("Pinterest not configured", `<h1 class="bad">Pinterest not configured</h1><p>Set <code>PINTEREST_APP_ID</code> and <code>PINTEREST_APP_SECRET</code> first (see SOCIAL.md).</p>`, 500);
  }

  const state = randomBytes(16).toString("hex");
  const authorize = new URL("https://www.pinterest.com/oauth/");
  authorize.search = new URLSearchParams({
    client_id: appId,
    redirect_uri: callbackUrl(request),
    response_type: "code",
    scope: PINTEREST_SCOPES.join(","),
    state,
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": `${STATE_COOKIE}=${state}; Path=/api/pinterest; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}
