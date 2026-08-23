import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  async redirects() {
    // The village was renamed from Meadowbrook to Budderlee (trademark
    // caution). Keep old links and indexed URLs working.
    return [
      { source: "/meadowbrook", destination: "/budderlee", permanent: true },
      {
        source: "/meadowbrook/:path*",
        destination: "/budderlee/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Baseline hardening; not a ranking factor, but a Lighthouse
        // best-practice and it keeps /admin from being framed.
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Seal animation assets never change without a rename.
        source: "/budderlee/anim/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  images: {
    // AVIF first: ~20-30% smaller than WebP for the painting photos.
    formats: ["image/avif", "image/webp"],
    // Allow SVG placeholders until real photos are in place. Remove
    // dangerouslyAllowSVG once paintings are real JPG/PNG files.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Vercel Blob storage for painting images in production
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default withPayload(nextConfig);
