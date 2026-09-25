// Check of the Lumaprints setup: lists the stores the API key can order
// under and the options for the default product, and resolves the
// default "0.50in Bleed" option. Places no orders unless --order is given.
//
//   node --env-file=.env.lumaprints --import tsx scripts/lumaprints-check.ts
//
// --order <painting-slug> places one SANDBOX order for that painting's
// 6×6 print, built the same way a paid checkout builds it (the print
// file, or the painting's first image, read from the live site). It
// refuses to run against production: Lumaprints revokes API access for
// test orders sent there.
import {
  DEFAULT_OPTIONS,
  DEFAULT_SUBCATEGORY_ID,
  getStores,
  getSubcategoryOptions,
  lumaprintsConfig,
  resolveOptionIds,
  submitOrder,
} from "../src/lib/lumaprints";

const SITE = "https://www.barbarajdemers.com";

type SitePainting = {
  slug: string;
  images?: { image?: { url?: string | null } | null }[];
  printOptions?: {
    widthIn: number;
    heightIn: number;
    lumaprints?: boolean | null;
    lumaprintsSubcategoryId?: number | null;
    lumaprintsOptions?: string | null;
    printFile?: { url?: string | null } | null;
  }[];
};

async function placeSandboxOrder(slug: string) {
  const config = lumaprintsConfig()!;
  if (config.env !== "sandbox") {
    throw new Error("--order only runs against the sandbox (unset LUMAPRINTS_ENV).");
  }
  const res = await fetch(
    `${SITE}/api/paintings?where[slug][equals]=${encodeURIComponent(slug)}&depth=1&limit=1`,
  );
  const painting = ((await res.json()) as { docs: SitePainting[] }).docs[0];
  if (!painting) throw new Error(`No painting "${slug}" on ${SITE}.`);
  const print = painting.printOptions?.find((opt) => opt.lumaprints);
  if (!print) throw new Error(`"${slug}" has no Lumaprints print size.`);

  const raw = print.printFile?.url ?? painting.images?.[0]?.image?.url;
  if (!raw) throw new Error(`"${slug}" has no image.`);
  const imageUrl = raw.startsWith("/") ? `${SITE}${raw}` : raw;
  const subcategoryId = print.lumaprintsSubcategoryId ?? DEFAULT_SUBCATEGORY_ID;
  const optionIds = await resolveOptionIds(config, subcategoryId, print.lumaprintsOptions ?? undefined);

  console.log(`\nPlacing a SANDBOX order: ${print.widthIn}×${print.heightIn} of "${slug}"`);
  console.log(`  file: ${imageUrl}${print.printFile?.url ? "" : " (painting image; no print file uploaded)"}`);
  console.log(`  product ${subcategoryId}, options ${optionIds.join(", ") || "(defaults)"}`);
  const orderNumber = await submitOrder(config, {
    externalId: `sandbox-test-${Date.now()}`,
    recipient: {
      firstName: "Sandbox",
      lastName: "Test",
      addressLine1: "123 Main St.",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US",
    },
    items: [
      {
        externalItemId: `${slug}-test`,
        subcategoryId,
        quantity: 1,
        width: print.widthIn,
        height: print.heightIn,
        imageUrl,
        optionIds,
      },
    ],
  });
  console.log(`\nAccepted: sandbox order #${orderNumber}. It shows at https://sandbox.lumaprints.com/order/list within a few minutes.`);
}

async function main() {
  const config = lumaprintsConfig();
  if (!config) {
    console.error(
      "Set LUMAPRINTS_API_KEY, LUMAPRINTS_API_SECRET and LUMAPRINTS_STORE_ID (and LUMAPRINTS_ENV=production for the live account).",
    );
    process.exit(1);
  }
  console.log(`Environment: ${config.env} (${config.baseUrl})`);

  const stores = await getStores(config);
  console.log("\nStandard stores:");
  for (const s of stores) {
    console.log(`  ${s.storeId}  ${s.storeName}${s.storeId === config.storeId ? "  <- LUMAPRINTS_STORE_ID" : ""}`);
  }
  if (!stores.some((s) => s.storeId === config.storeId)) {
    console.warn(`\nLUMAPRINTS_STORE_ID=${config.storeId} is not one of these stores.`);
  }

  const groups = await getSubcategoryOptions(config, DEFAULT_SUBCATEGORY_ID);
  console.log(`\nOptions for product ${DEFAULT_SUBCATEGORY_ID}:`);
  for (const g of groups) {
    console.log(`  ${g.optionGroup}`);
    for (const item of g.optionGroupItems) {
      console.log(`    ${item.optionId}  ${item.optionName}`);
    }
  }

  const ids = await resolveOptionIds(config, DEFAULT_SUBCATEGORY_ID, DEFAULT_OPTIONS);
  console.log(`\n"${DEFAULT_OPTIONS}" resolves to option ${ids.join(", ")}.`);

  const orderFlag = process.argv.indexOf("--order");
  if (orderFlag !== -1) {
    await placeSandboxOrder(process.argv[orderFlag + 1] ?? "fox-in-suit");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
