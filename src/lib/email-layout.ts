import { SITE_URL } from "./site-url";

// The studio's email look: a cream page, a white card, Barbara's
// signature. Shared by every email a customer receives.

export const site = SITE_URL.replace(/^https?:\/\//, "");

export function shell(inner: string) {
  return `
  <div style="background:#fefcf4;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px 32px;font-family:Georgia,'Times New Roman',serif;color:#3a3a33;">
      ${inner}
      <p style="margin:24px 0 0;font-size:16px;line-height:1.5;">
        Barbara J Demers<br/>
        <a href="${SITE_URL}" style="color:#8a7a2e;">${site}</a>
      </p>
    </div>
  </div>`;
}

export const p = (text: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${text}</p>`;
export const h1 = (text: string) => `<h1 style="margin:0 0 18px;font-size:26px;font-weight:normal;line-height:1.25;">${text}</h1>`;
export const link = (href: string, text: string) => `<a href="${href}" style="color:#8a7a2e;">${text}</a>`;

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
