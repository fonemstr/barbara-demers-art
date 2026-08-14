// Client-safe subject group taxonomy. Kept separate from `paintings.ts` so
// client components can import labels without pulling Payload into the bundle.

export type SubjectGroup =
  | "none"
  | "dog"
  | "cat"
  | "horse"
  | "farm"
  | "wild"
  | "bird"
  | "other";

export const SUBJECT_GROUP_LABELS: Record<SubjectGroup, string> = {
  // Collection-only paintings (e.g. Budderlee residents) — deliberately
  // absent from SUBJECT_GROUPS below so no gallery filter chip appears;
  // they show under "All" and on their collection's own page.
  none: "Original Paintings",
  dog: "Dogs",
  cat: "Cats",
  horse: "Pasture — Horses",
  farm: "Pasture — Farm Animals",
  wild: "The Wild — Land Animals",
  bird: "The Wild — Birds",
  other: "Small Wonders — Insects, Flowers, and Other Small Lives",
};

export const SUBJECT_GROUPS: SubjectGroup[] = [
  "dog",
  "cat",
  "horse",
  "farm",
  "wild",
  "bird",
  "other",
];
