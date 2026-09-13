import { createHmac, timingSafeEqual } from "crypto";

// Signed, short-lived links for "manage my subscription". Stripe's own
// portal URLs expire in minutes, so the email carries a link to our
// /api/post/portal/go route, which creates the portal session on click.

const TTL_MS = 60 * 60 * 1000;

function secret(): string {
  const s = process.env.PAYLOAD_SECRET;
  if (!s) throw new Error("PAYLOAD_SECRET is required to sign portal links.");
  return s;
}

function sign(customerId: string, exp: number): string {
  return createHmac("sha256", secret()).update(`${customerId}.${exp}`).digest("base64url");
}

export function makePortalToken(customerId: string): { c: string; e: string; s: string } {
  const exp = Date.now() + TTL_MS;
  return { c: customerId, e: String(exp), s: sign(customerId, exp) };
}

export function verifyPortalToken(c: string, e: string, s: string): string | null {
  const exp = Number(e);
  if (!c || !Number.isFinite(exp) || Date.now() > exp) return null;
  const expected = sign(c, exp);
  const a = Buffer.from(expected);
  const b = Buffer.from(s);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return c;
}
