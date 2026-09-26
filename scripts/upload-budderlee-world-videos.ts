/**
 * Uploads the Budderlee scroll-world clips to Vercel Blob.
 *
 * The clips (six scene dives and five connectors) are too heavy to keep in
 * git, so they live in Blob and the page reads them from there. Re-run this
 * after re-rendering a clip; it overwrites the file at the same path.
 *
 *   BLOB_READ_WRITE_TOKEN=… pnpm tsx scripts/upload-budderlee-world-videos.ts <dir-with-mp4s>
 *
 * Prints the store's base URL for BUDDERLEE_WORLD_VIDEO_BASE in
 * src/components/budderlee-world/scroll-world.tsx.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const CLIPS = [
  "village", "green", "market", "station", "orchard", "potters",
  "conn1", "conn2", "conn3", "conn4", "conn5",
];

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error("usage: upload-budderlee-world-videos.ts <dir-with-mp4s>");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not set");

  let base = "";
  for (const name of CLIPS) {
    const body = await readFile(path.join(dir, `${name}.mp4`));
    const blob = await put(`budderlee/world/vid/${name}.mp4`, body, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
    base = blob.url.slice(0, blob.url.lastIndexOf("/"));
    console.log(`${name}.mp4 → ${blob.url} (${(body.length / 1e6).toFixed(1)} MB)`);
  }
  console.log(`\nBase URL: ${base}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
