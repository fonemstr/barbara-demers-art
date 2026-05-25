import { NextResponse } from "next/server";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";

// Dev-only seed endpoint. Creates sample paintings + a welcome journal
// post if they don't already exist. Returns 404 in production.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const publicDir = path.join(process.cwd(), "public", "paintings");

  const seedPaintings = [
    {
      slug: "river-otter-study",
      title: "River Otter, Morning Light",
      subject: "River otter",
      year: 2026,
      medium: "Oil on linen",
      widthIn: 16,
      heightIn: 20,
      priceCents: 85000,
      sizeTier: "medium" as const,
      featured: true,
      description:
        "Study of a river otter caught in early morning light on the shoreline. Built up in thin glazes over a warm underpainting, with the wet fur worked wet-into-wet.",
      imageFile: "placeholder-1.svg",
      alt: "Oil painting study of a river otter in warm morning light",
    },
    {
      slug: "red-fox-in-winter",
      title: "Red Fox in Winter",
      subject: "Red fox",
      year: 2026,
      medium: "Oil on canvas",
      widthIn: 24,
      heightIn: 30,
      priceCents: 145000,
      sizeTier: "large" as const,
      featured: true,
      description:
        "A red fox pausing in fresh snow. Bold brushwork in the tail balances the softer handling of the snowbanks behind.",
      imageFile: "placeholder-2.svg",
      alt: "Red fox standing in fresh snow in winter light",
    },
    {
      slug: "barn-owl-portrait",
      title: "Barn Owl Portrait",
      subject: "Barn owl",
      year: 2025,
      medium: "Oil on panel",
      widthIn: 12,
      heightIn: 12,
      priceCents: 52000,
      sizeTier: "small" as const,
      featured: true,
      description:
        "Close study of a barn owl's face. Careful value work through the feathers, with the eyes kept as the focal point.",
      imageFile: "placeholder-3.svg",
      alt: "Close portrait of a barn owl with detailed feather work",
    },
    {
      slug: "horse-at-pasture",
      title: "Horse at Pasture",
      subject: "Horse",
      year: 2025,
      medium: "Oil on canvas",
      widthIn: 20,
      heightIn: 24,
      priceCents: 110000,
      sizeTier: "medium" as const,
      description:
        "A bay gelding grazing in late afternoon. Loose atmospheric handling in the background pasture, tighter drawing in the figure.",
      imageFile: "placeholder-4.svg",
      alt: "Bay gelding grazing in an afternoon pasture",
      sold: true,
    },
    {
      slug: "grey-wolf-watching",
      title: "Grey Wolf, Watching",
      subject: "Grey wolf",
      year: 2026,
      medium: "Oil on linen",
      widthIn: 18,
      heightIn: 24,
      priceCents: 125000,
      sizeTier: "medium" as const,
      featured: true,
      description:
        "A lone grey wolf at the edge of a clearing, still and alert. The painting is built around the tension between the soft brush of the surrounding pines and the tight handling of the eyes.",
      imageFile: "placeholder-1.svg",
      alt: "Grey wolf at the edge of a pine clearing",
    },
    {
      slug: "labrador-at-home",
      title: "Labrador at Home",
      subject: "Yellow labrador",
      year: 2025,
      medium: "Oil on panel",
      widthIn: 11,
      heightIn: 14,
      priceCents: 48000,
      sizeTier: "small" as const,
      description:
        "A favorite family yellow lab napping in a stripe of living-room sun. A quiet piece — the kind of painting that belongs on a bookshelf, not above a mantel.",
      imageFile: "placeholder-3.svg",
      alt: "Yellow labrador napping in afternoon sunlight",
    },
  ];

  try {
    const payload = await getPayload({ config });
    const created: string[] = [];
    const skipped: string[] = [];

    for (const item of seedPaintings) {
      const existing = await payload.find({
        collection: "paintings",
        where: { slug: { equals: item.slug } },
        limit: 1,
      });
      if (existing.docs.length) {
        skipped.push(item.slug);
        continue;
      }

      const media = await payload.create({
        collection: "media",
        data: { alt: item.alt },
        filePath: path.join(publicDir, item.imageFile),
      });

      await payload.create({
        collection: "paintings",
        data: {
          title: item.title,
          slug: item.slug,
          subject: item.subject,
          year: item.year,
          medium: item.medium,
          widthIn: item.widthIn,
          heightIn: item.heightIn,
          priceCents: item.priceCents,
          sizeTier: item.sizeTier,
          description: item.description,
          images: [{ image: media.id }],
          featured: item.featured ?? false,
          sold: item.sold ?? false,
        },
      });
      created.push(item.slug);
    }

    // Welcome journal post
    let journal = "skipped";
    const existingPost = await payload.find({
      collection: "journal-posts",
      where: { slug: { equals: "welcome-to-the-studio" } },
      limit: 1,
    });
    if (!existingPost.docs.length) {
      await payload.create({
        collection: "journal-posts",
        data: {
          title: "Welcome to the studio",
          slug: "welcome-to-the-studio",
          excerpt:
            "A short note on why this website exists, and what you'll find here.",
          status: "published",
          publishedAt: new Date().toISOString(),
          body: {
            root: {
              type: "root",
              format: "",
              indent: 0,
              version: 1,
              direction: "ltr",
              children: [
                {
                  type: "paragraph",
                  version: 1,
                  children: [
                    {
                      type: "text",
                      version: 1,
                      text:
                        "Thank you for stopping by. This little corner of the internet is where I'll share new paintings as they come out of the studio, keep a running archive of what's for sale, and occasionally post a progress photo or a note from the easel.",
                      format: 0,
                    },
                  ],
                },
                {
                  type: "paragraph",
                  version: 1,
                  children: [
                    {
                      type: "text",
                      version: 1,
                      text: "— Barbara",
                      format: 2,
                    },
                  ],
                },
              ],
            },
          },
        },
      });
      journal = "created";
    }

    return NextResponse.json({ ok: true, created, skipped, journal });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seed failed";
    console.error("[dev-seed]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
