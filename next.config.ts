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
  images: {
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
