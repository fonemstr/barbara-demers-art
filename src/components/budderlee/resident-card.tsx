import Image from "next/image";
import Link from "next/link";
import { residentName, residentNumberLabel, type Painting } from "@/data/paintings";
import { formatPrice, lowestPrintPriceCents } from "@/lib/utils";
import s from "./budderlee.module.css";

/** A resident's painting, name, occupation and availability, linking to their page. */
export function ResidentCard({ painting: p, showNumber = false }: { painting: Painting; showNumber?: boolean }) {
  const name = residentName(p);
  const printsFrom = lowestPrintPriceCents(p);
  return (
    <Link href={`/budderlee/residents/${p.slug}`} className={s.residentCard}>
      <div className="relative aspect-square">
        <Image
          src={p.images[0]}
          alt={`${name}${p.characterRole ? `, ${p.characterRole}` : ""}: the original painting`}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 90vw"
          className={`${s.photo} object-cover`}
        />
      </div>
      {showNumber && p.residentNumber != null && (
        <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-on-surface-faint">
          {residentNumberLabel(p.residentNumber)}
        </p>
      )}
      <h3 className={`${showNumber ? "mt-1" : "mt-4"} text-[26px] leading-tight`}>{name}</h3>
      {p.characterRole && <p className="italic text-on-surface-subtle">{p.characterRole}</p>}
      <p className={`${s.availability} ${p.sold ? s.sold : s.available}`}>
        {p.sold ? "Original sold" : `Original available · ${formatPrice(p.priceCents)}`}
      </p>
      {p.sold && printsFrom !== undefined && (
        <p className="text-sm text-on-surface-subtle">Prints from {formatPrice(printsFrom)}</p>
      )}
    </Link>
  );
}
