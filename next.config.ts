import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow SVG placeholders until real photos are in place. Remove
    // dangerouslyAllowSVG once paintings are real JPG/PNG files.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
