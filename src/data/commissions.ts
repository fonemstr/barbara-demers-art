// Commission size tiers and deposits. Pure data — no Payload imports —
// so client components can use it without pulling server code into the
// bundle. Prices are "starting at" guides; Barbara confirms the exact
// price in her reply before anyone pays a deposit. The deposit is flat
// per tier and applied toward the final price.

export type CommissionTier = {
  id: "small" | "medium" | "large";
  label: string;
  sizeNote: string;
  priceFromCents: number;
  depositCents: number;
};

export const COMMISSION_TIERS: CommissionTier[] = [
  {
    id: "small",
    label: "Small",
    sizeNote: "Up to 12×16 in",
    priceFromCents: 65000,
    depositCents: 15000,
  },
  {
    id: "medium",
    label: "Medium",
    sizeNote: "Up to 20×24 in",
    priceFromCents: 95000,
    depositCents: 25000,
  },
  {
    id: "large",
    label: "Large",
    sizeNote: "Up to 30×40 in",
    priceFromCents: 145000,
    depositCents: 35000,
  },
];

export function getCommissionTier(id: string): CommissionTier | undefined {
  return COMMISSION_TIERS.find((t) => t.id === id);
}
