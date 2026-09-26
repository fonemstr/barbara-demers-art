/**
 * Uploads the heavy Budderlee assets to Vercel Blob, where the pages read
 * them from (they're too big to keep in git):
 *
 *   videos     the scroll-world clips (six scene dives, five connectors)
 *              → budderlee/world/vid/<name>.mp4, used by /budderlee/village
 *   residents  the nine 3D resident models (meshopt-compressed GLB)
 *              → budderlee/world/residents/<id>.glb, used by /budderlee/residents-3d
 *
 * Re-run after re-rendering a clip or remaking a model; it overwrites the file
 * at the same path, so the pages need no change.
 *
 *   BLOB_READ_WRITE_TOKEN=… pnpm tsx scripts/upload-budderlee-world-assets.ts videos <dir-with-mp4s>
 *   BLOB_READ_WRITE_TOKEN=… pnpm tsx scripts/upload-budderlee-world-assets.ts residents <dir-with-glbs>
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const SETS = {
  videos: {
    prefix: "budderlee/world/vid",
    ext: "mp4",
    contentType: "video/mp4",
    names: ["village", "green", "market", "station", "orchard", "potters", "conn1", "conn2", "conn3", "conn4", "conn5"],
  },
  residents: {
    prefix: "budderlee/world/residents",
    ext: "glb",
    contentType: "model/gltf-binary",
    names: ["hugo", "ferdinand", "walter", "clara", "maisie", "olive", "henry", "arthur", "theodore"],
  },
} as const;

async function main() {
  const [set, dir] = process.argv.slice(2) as [keyof typeof SETS, string];
  const spec = SETS[set];
  if (!spec || !dir) throw new Error("usage: upload-budderlee-world-assets.ts <videos|residents> <dir>");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is not set");

  let base = "";
  for (const name of spec.names) {
    const body = await readFile(path.join(dir, `${name}.${spec.ext}`));
    const blob = await put(`${spec.prefix}/${name}.${spec.ext}`, body, {
      access: "public",
      contentType: spec.contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
    base = blob.url.slice(0, blob.url.lastIndexOf("/"));
    console.log(`${name}.${spec.ext} → ${blob.url} (${(body.length / 1e6).toFixed(1)} MB)`);
  }
  console.log(`\nBase URL: ${base}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
