import type { Payload } from "payload";
import { getBudderleePostSettings } from "./budderlee-post";

// The monthly cycle of The Budderlee Post, as operations on the admin's
// collections: generate the shipping list at the cutoff, export it for
// the label tool, and mark the batch shipped. All called from the
// Fulfillment page in the admin and its routes.

type AddressSnapshot = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export function shippableStatuses(includePastDue: boolean): ("active" | "past_due")[] {
  return includePastDue ? ["active", "past_due"] : ["active"];
}

export type GenerateResult = {
  added: number;
  alreadyListed: number;
  total: number;
  missingAddress: number;
};

/**
 * Snapshot every shippable subscriber into a Shipment for the issue.
 * Safe to run again: subscribers already on the list are left alone
 * (including ones marked skipped or shipped), and new signups since the
 * last run are added.
 */
export async function generateShippingList(payload: Payload, issueId: number | string): Promise<GenerateResult> {
  const issue = await payload.findByID({ collection: "issues", id: issueId, depth: 0, overrideAccess: true });
  const settings = await getBudderleePostSettings();

  const subs = await payload.find({
    collection: "subscribers",
    where: { status: { in: shippableStatuses(settings.includePastDue) } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });

  const existing = await payload.find({
    collection: "shipments",
    where: { issue: { equals: issue.id } },
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  });
  const listed = new Set(
    existing.docs.map((s) => (typeof s.subscriber === "object" && s.subscriber ? s.subscriber.id : s.subscriber)),
  );

  let added = 0;
  let missingAddress = 0;
  for (const sub of subs.docs) {
    if (listed.has(sub.id)) continue;
    const sent = sub.packagesSent ?? 0;
    const address: AddressSnapshot = sub.shippingAddress ?? {};
    if (!address.line1) missingAddress++;
    await payload.create({
      collection: "shipments",
      data: {
        label: address.name || sub.name || sub.email,
        issue: issue.id,
        subscriber: sub.id,
        email: sub.email,
        status: "pending",
        firstPackage: sent === 0,
        includeFoundingSticker: !!sub.foundingMember && sent === 0,
        addressSnapshot: {
          name: address.name ?? sub.name ?? null,
          line1: address.line1 ?? null,
          line2: address.line2 ?? null,
          city: address.city ?? null,
          state: address.state ?? null,
          postalCode: address.postalCode ?? null,
          country: address.country ?? null,
        },
      },
      overrideAccess: true,
    });
    added++;
  }

  await payload.update({
    collection: "issues",
    id: issue.id,
    data: {
      shippingListGeneratedAt: new Date().toISOString(),
      ...(issue.status === "planning" ? { status: "printer" } : {}),
    },
    overrideAccess: true,
  });

  return { added, alreadyListed: existing.totalDocs, total: existing.totalDocs + added, missingAddress };
}

/** Mark every pending shipment of the issue shipped, and the issue too. */
export async function markIssueShipped(payload: Payload, issueId: number | string): Promise<number> {
  const pending = await payload.find({
    collection: "shipments",
    where: { and: [{ issue: { equals: issueId } }, { status: { equals: "pending" } }] },
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  });
  // One at a time so the Shipments hooks run and count each package.
  for (const s of pending.docs) {
    await payload.update({ collection: "shipments", id: s.id, data: { status: "shipped" }, overrideAccess: true });
  }
  await payload.update({ collection: "issues", id: issueId, data: { status: "shipped" }, overrideAccess: true });
  return pending.totalDocs;
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * The shipping list as CSV, in the column layout Pirate Ship and USPS
 * Click-N-Ship import, plus the packing columns Barbara needs.
 * Skipped rows are left out.
 */
export async function buildShippingCsv(payload: Payload, issueId: number | string): Promise<{ filename: string; csv: string; rows: number }> {
  const issue = await payload.findByID({ collection: "issues", id: issueId, depth: 0, overrideAccess: true });
  const shipments = await payload.find({
    collection: "shipments",
    where: { and: [{ issue: { equals: issue.id } }, { status: { not_equals: "skipped" } }] },
    limit: 2000,
    depth: 1,
    sort: "label",
    overrideAccess: true,
  });

  const header = [
    "Name", "Address 1", "Address 2", "City", "State", "Zip", "Country", "Email",
    "First package", "Founding sticker", "Status", "Tracking", "Subscriber notes", "Shipment notes",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const s of shipments.docs) {
    const a = s.addressSnapshot ?? {};
    const sub = typeof s.subscriber === "object" && s.subscriber ? s.subscriber : null;
    lines.push(
      [
        a.name ?? s.label ?? "",
        a.line1 ?? "",
        a.line2 ?? "",
        a.city ?? "",
        a.state ?? "",
        a.postalCode ?? "",
        a.country ?? "US",
        s.email ?? sub?.email ?? "",
        s.firstPackage ? "yes" : "",
        s.includeFoundingSticker ? "yes" : "",
        s.status,
        s.trackingNumber ?? "",
        sub?.notes ?? "",
        s.notes ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  const month = issue.mailingMonth ? new Date(issue.mailingMonth).toISOString().slice(0, 7) : "issue";
  return { filename: `budderlee-post-${month}.csv`, csv: lines.join("\r\n") + "\r\n", rows: shipments.totalDocs };
}

export type IssueOverview = {
  id: number;
  title: string;
  mailingMonth: string;
  status: string;
  shippingListGeneratedAt: string | null;
  pending: number;
  shipped: number;
  skipped: number;
};

export async function getIssueOverviews(payload: Payload, limit = 12): Promise<IssueOverview[]> {
  const issues = await payload.find({
    collection: "issues",
    sort: "-mailingMonth",
    limit,
    depth: 0,
    overrideAccess: true,
  });
  const out: IssueOverview[] = [];
  for (const issue of issues.docs) {
    const count = async (status: string) =>
      (
        await payload.count({
          collection: "shipments",
          where: { and: [{ issue: { equals: issue.id } }, { status: { equals: status } }] },
          overrideAccess: true,
        })
      ).totalDocs;
    const [pending, shipped, skipped] = await Promise.all([count("pending"), count("shipped"), count("skipped")]);
    out.push({
      id: issue.id,
      title: issue.title ?? "",
      mailingMonth: issue.mailingMonth,
      status: issue.status,
      shippingListGeneratedAt: issue.shippingListGeneratedAt ?? null,
      pending,
      shipped,
      skipped,
    });
  }
  return out;
}

export type SubscriberCounts = Record<"active" | "trialing" | "past_due" | "paused" | "canceled", number>;

export async function getSubscriberCounts(payload: Payload): Promise<SubscriberCounts> {
  const statuses = ["active", "trialing", "past_due", "paused", "canceled"] as const;
  const counts = await Promise.all(
    statuses.map(async (s) =>
      (await payload.count({ collection: "subscribers", where: { status: { equals: s } }, overrideAccess: true })).totalDocs,
    ),
  );
  return Object.fromEntries(statuses.map((s, i) => [s, counts[i]])) as SubscriberCounts;
}

/** The signed-in admin for a fulfillment route, or null. */
export async function adminFromRequest(payload: Payload, request: Request) {
  try {
    const { user } = await payload.auth({ headers: request.headers });
    return user ?? null;
  } catch {
    return null;
  }
}

/** Same-origin check for the form posts, so a stray link elsewhere can't fire them. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  return origin === new URL(request.url).origin;
}
