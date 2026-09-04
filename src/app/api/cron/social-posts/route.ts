import { getPayload } from "payload";
import config from "@payload-config";
import { sendSocialPost, type SocialPlatform } from "@/lib/social-direct";

// Delivers scheduled social posts that have come due. Triggered every 15
// minutes by the GitHub Actions workflow (.github/workflows/social-cron.yml);
// a Vercel cron can call it too. Authenticated with CRON_SECRET.

export const maxDuration = 300;

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await getPayload({ config });
  const due = await payload.find({
    collection: "social-posts",
    where: {
      status: { equals: "scheduled" },
      scheduleAt: { less_than_equal: new Date().toISOString() },
    },
    limit: 10,
    overrideAccess: true,
  });

  const outcomes: { id: number | string; ok: boolean }[] = [];
  for (const doc of due.docs) {
    let mediaUrls: string[] = [];
    if (doc.image) {
      const imageId = typeof doc.image === "object" ? doc.image.id : doc.image;
      const media = await payload
        .findByID({ collection: "media", id: imageId, overrideAccess: true })
        .catch(() => null);
      if (media?.url) mediaUrls = [media.url];
    }

    const result = await sendSocialPost({
      post: doc.message ?? "",
      platforms: (doc.platforms ?? []) as SocialPlatform[],
      mediaUrls,
    });

    await payload.update({
      collection: "social-posts",
      id: doc.id,
      data: {
        status: result.ok ? "posted" : "failed",
        result: result.summary,
      },
      overrideAccess: true,
    });
    outcomes.push({ id: doc.id, ok: result.ok });
  }

  return Response.json({ checked: due.totalDocs, sent: outcomes });
}
