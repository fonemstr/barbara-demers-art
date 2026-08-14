import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Users } from "./src/collections/Users";
import { Media } from "./src/collections/Media";
import { Paintings } from "./src/collections/Paintings";
import { JournalPosts } from "./src/collections/JournalPosts";
import { SocialPosts } from "./src/collections/SocialPosts";
import { CommissionedPortraits } from "./src/collections/CommissionedPortraits";
import { Newsletters } from "./src/collections/Newsletters";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: " — Barbara J Demers Studio",
    },
  },
  collections: [Users, Media, Paintings, JournalPosts, SocialPosts, CommissionedPortraits, Newsletters],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "insecure-dev-secret-change-me",
  typescript: {
    outputFile: path.resolve(dirname, "src/payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      // Vercel Postgres exposes POSTGRES_URL; the new Neon integration uses
      // DATABASE_URL; some integrations only set POSTGRES_PRISMA_URL. Accept
      // any of them so the admin route doesn't silently fall back to
      // localhost in production.
      connectionString:
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL_NON_POOLING ||
        "",
    },
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
});
