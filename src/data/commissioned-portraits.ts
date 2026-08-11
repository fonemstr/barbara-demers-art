import { getPayloadClient } from "@/lib/payload";

// Finished commissions shown on the commissions page. Server-only —
// mirrors the paintings data layer, but there's no seed fallback: with no
// entries (or no database) the page simply hides the section.

export type CommissionedPortrait = {
  id: number;
  title: string;
  subject?: string;
  year?: number;
  medium?: string;
  widthIn?: number;
  heightIn?: number;
  images: string[];
  ownerQuote?: string;
  ownerName?: string;
  ownerLocation?: string;
};

type PayloadCommissionedPortrait = {
  id: number;
  title: string;
  subject?: string | null;
  year?: number | null;
  medium?: string | null;
  widthIn?: number | null;
  heightIn?: number | null;
  images?: Array<{ image: { url?: string } | number }> | null;
  ownerQuote?: string | null;
  ownerName?: string | null;
  ownerLocation?: string | null;
};

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function getCommissionedPortraits(): Promise<
  CommissionedPortrait[]
> {
  const payload = await getPayloadClient();
  if (!payload) return [];

  try {
    const result = await payload.find({
      collection: "commissioned-portraits",
      depth: 2,
      limit: 100,
      sort: "-createdAt",
    });
    return (result.docs as unknown as PayloadCommissionedPortrait[])
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        subject: normalize(doc.subject),
        year: doc.year ?? undefined,
        medium: normalize(doc.medium),
        widthIn: doc.widthIn ?? undefined,
        heightIn: doc.heightIn ?? undefined,
        images: (doc.images ?? [])
          .map((entry) =>
            typeof entry.image === "object" ? (entry.image.url ?? null) : null,
          )
          .filter((url): url is string => !!url),
        ownerQuote: normalize(doc.ownerQuote),
        ownerName: normalize(doc.ownerName),
        ownerLocation: normalize(doc.ownerLocation),
      }))
      .filter((p) => p.images.length > 0);
  } catch (err) {
    console.error("[commissioned-portraits] Payload query failed:", err);
    return [];
  }
}
