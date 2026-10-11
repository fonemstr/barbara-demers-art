import localFont from "next/font/local";
import s from "@/components/budderlee/budderlee.module.css";
import { BudderleeFooter, BudderleeMasthead } from "@/components/budderlee/masthead";

// Budderlee's own type, after Barbara's page concept: Cormorant Garamond
// headings and EB Garamond text, self-hosted like the site's other fonts.
const cormorant = localFont({
  variable: "--font-cormorant",
  src: [
    { path: "../../fonts/cormorant-garamond/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/cormorant-garamond/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../../fonts/cormorant-garamond/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const ebGaramond = localFont({
  variable: "--font-eb-garamond",
  src: [
    { path: "../../fonts/eb-garamond/eb-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/eb-garamond/eb-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../fonts/eb-garamond/eb-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../fonts/eb-garamond/eb-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export default function BudderleeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${s.theme} ${cormorant.variable} ${ebGaramond.variable} flex flex-1 flex-col`}>
      <BudderleeMasthead />
      <main className="flex-1">{children}</main>
      <BudderleeFooter />
    </div>
  );
}
