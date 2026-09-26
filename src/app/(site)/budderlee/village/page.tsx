import { ScrollWorld } from "@/components/budderlee-world/scroll-world";

export const metadata = {
  title: "Walk Through Budderlee",
  alternates: { canonical: "/budderlee/village" },
  description:
    "Scroll into the village of Budderlee, a little clay-diorama world where Barbara J Demers' painted animal residents live, shop and gather under the Budderlee Tree.",
  openGraph: {
    type: "website",
    siteName: "Barbara J Demers",
    title: "Walk Through Budderlee",
    description:
      "Scroll into the village of Budderlee and meet its painted animal residents under the Budderlee Tree.",
    images: [
      {
        url: "/budderlee/world/village.webp",
        alt: "The village of Budderlee as a little clay diorama, with its residents out and about",
      },
    ],
  },
};

export default function BudderleeVillagePage() {
  return <ScrollWorld />;
}
