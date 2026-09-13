// Star signs for the resident profile on the back of each Budderlee card.
// Shared by the Paintings admin hook (auto-fill from the birthday) and the
// pages that print the profile.

export type StarSign =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export const STAR_SIGNS: { value: StarSign; label: string; symbol: string }[] = [
  { value: "aries", label: "Aries", symbol: "♈" },
  { value: "taurus", label: "Taurus", symbol: "♉" },
  { value: "gemini", label: "Gemini", symbol: "♊" },
  { value: "cancer", label: "Cancer", symbol: "♋" },
  { value: "leo", label: "Leo", symbol: "♌" },
  { value: "virgo", label: "Virgo", symbol: "♍" },
  { value: "libra", label: "Libra", symbol: "♎" },
  { value: "scorpio", label: "Scorpio", symbol: "♏" },
  { value: "sagittarius", label: "Sagittarius", symbol: "♐" },
  { value: "capricorn", label: "Capricorn", symbol: "♑" },
  { value: "aquarius", label: "Aquarius", symbol: "♒" },
  { value: "pisces", label: "Pisces", symbol: "♓" },
];

export const STAR_SIGN_LABELS: Record<StarSign, string> = Object.fromEntries(
  STAR_SIGNS.map((s) => [s.value, s.label]),
) as Record<StarSign, string>;

// Sign boundaries as [month, day] of the first day of each sign, in
// calendar order starting from Capricorn's January half.
const STARTS: [number, number, StarSign][] = [
  [1, 20, "aquarius"],
  [2, 19, "pisces"],
  [3, 21, "aries"],
  [4, 20, "taurus"],
  [5, 21, "gemini"],
  [6, 21, "cancer"],
  [7, 23, "leo"],
  [8, 23, "virgo"],
  [9, 23, "libra"],
  [10, 23, "scorpio"],
  [11, 22, "sagittarius"],
  [12, 22, "capricorn"],
];

/** Star sign for a month (1-12) and day. */
export function starSignFor(month: number, day: number): StarSign {
  let sign: StarSign = "capricorn";
  for (const [m, d, s] of STARTS) {
    if (month > m || (month === m && day >= d)) sign = s;
  }
  return sign;
}

/**
 * Star sign from a stored date string. Payload's day-only picker saves
 * the date at noon UTC, so UTC month and day are the calendar day chosen.
 */
export function starSignForDate(iso: string): StarSign | undefined {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return starSignFor(d.getUTCMonth() + 1, d.getUTCDate());
}

/** "14 March" style birthday, year omitted on purpose (it's flavor). */
export function formatBirthday(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
}
