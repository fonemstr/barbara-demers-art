// Client-safe subject group taxonomy. Kept separate from `paintings.ts` so
// client components can import labels without pulling Payload into the bundle.

export type SubjectGroup =
  | "dog"
  | "cat"
  | "horse"
  | "farm"
  | "wild"
  | "bird"
  | "other";

export const SUBJECT_GROUP_LABELS: Record<SubjectGroup, string> = {
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
