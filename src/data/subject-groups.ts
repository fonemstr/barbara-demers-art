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
  horse: "Horses",
  farm: "Farm",
  wild: "Wild",
  bird: "Birds",
  other: "Other",
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
