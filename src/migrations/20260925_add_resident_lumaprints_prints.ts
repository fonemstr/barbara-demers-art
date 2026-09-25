import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// The seven residents Barbara set up as 6×6 Archival Matte prints (0.5 in
// bleed) in Lumaprints, September 2026. Maisie has no Lumaprints product
// yet, so she is left out. Runs once, on the deploy that ships the
// Lumaprints integration, so the prints go on sale together with it.
const RESIDENT_SLUGS = [
  'fox-in-suit',
  'raccoon-in-clothing',
  'opossum-holding-apples',
  'goose-wearing-dress',
  'henry-pig-potter',
  'hugo-station-master-stop-watch',
  'arthur-bookstore',
]

const PRINT = {
  widthIn: 6,
  heightIn: 6,
  priceCents: 3500,
  lumaprints: true,
  lumaprintsSubcategoryId: 103001,
  lumaprintsOptions: '0.50in Bleed',
}

type PrintRow = { id?: string | null; widthIn: number; heightIn: number }

const is6x6 = (row: PrintRow) => row.widthIn === 6 && row.heightIn === 6

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs } = await payload.find({
    collection: 'paintings',
    where: { slug: { in: RESIDENT_SLUGS } },
    depth: 0,
    limit: RESIDENT_SLUGS.length,
    req,
  })
  for (const doc of docs) {
    const existing = (doc.printOptions ?? []) as PrintRow[]
    // Preview databases and re-runs may already have one; never duplicate.
    if (existing.some(is6x6)) continue
    await payload.update({
      collection: 'paintings',
      id: doc.id,
      data: { printOptions: [...existing, PRINT] },
      depth: 0,
      req,
    })
    payload.logger.info(`[migrate] added 6×6 Lumaprints print to "${doc.slug}"`)
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const { docs } = await payload.find({
    collection: 'paintings',
    where: { slug: { in: RESIDENT_SLUGS } },
    depth: 0,
    limit: RESIDENT_SLUGS.length,
    req,
  })
  for (const doc of docs) {
    const existing = (doc.printOptions ?? []) as Array<PrintRow & { lumaprints?: boolean | null }>
    const kept = existing.filter((row) => !(is6x6(row) && row.lumaprints))
    if (kept.length === existing.length) continue
    await payload.update({
      collection: 'paintings',
      id: doc.id,
      data: { printOptions: kept },
      depth: 0,
      req,
    })
  }
}
