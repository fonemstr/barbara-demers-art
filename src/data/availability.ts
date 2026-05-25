export type AvailabilityStatus =
  | "available"
  | "reserved"
  | "sold"
  | "comingSoon"
  | "inStudio";

export type PriceDisplay = "visible" | "inquire" | "hidden";

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  comingSoon: "Coming soon",
  inStudio: "In studio",
};
