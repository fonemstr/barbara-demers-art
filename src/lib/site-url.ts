// Canonical production origin. NEXT_PUBLIC_SITE_URL wins so previews can
// override it, but an unset/blank value must not break metadata URLs.
const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = (raw || "https://www.barbarajdemers.com").replace(
  /\/+$/,
  "",
);
