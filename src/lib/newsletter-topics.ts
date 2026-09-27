import type { Resend } from "resend";

// The studio list is one Resend audience split by interest into Topics.
// A broadcast sent to a topic reaches only contacts opted in to it, and
// Resend's unsubscribe page lets each contact switch topics on or off.
// Both topics default to opt-in, so contacts from before topics existed
// keep getting everything until they say otherwise.

export const INTERESTS = {
  artwork: {
    name: "Original artwork",
    description: "New original paintings, the stories behind them, and commission news.",
  },
  budderlee: {
    name: "Budderlee",
    description: "New residents arriving in the village of Budderlee.",
  },
} as const;

export type Interest = keyof typeof INTERESTS;

export const ALL_INTERESTS = Object.keys(INTERESTS) as Interest[];

export function isInterest(value: unknown): value is Interest {
  return typeof value === "string" && value in INTERESTS;
}

let cached: Record<Interest, string> | null = null;

/** Topic IDs by interest, creating any topic missing from Resend. */
export async function resolveTopicIds(
  resend: Resend,
): Promise<Record<Interest, string>> {
  if (cached) return cached;
  const res = await resend.topics.list();
  if (res.error) throw new Error(res.error.message);
  const existing = res.data?.data ?? [];
  const ids = {} as Record<Interest, string>;
  for (const key of ALL_INTERESTS) {
    const { name, description } = INTERESTS[key];
    const found = existing.find((t) => t.name === name);
    if (found) {
      ids[key] = found.id;
      continue;
    }
    const created = await resend.topics.create({
      name,
      description,
      defaultSubscription: "opt_in",
    });
    if (created.error || !created.data) {
      throw new Error(created.error?.message ?? `Could not create the "${name}" topic`);
    }
    ids[key] = created.data.id;
  }
  cached = ids;
  return ids;
}
