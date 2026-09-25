// Read-only check of the Lumaprints setup: lists the stores the API key
// can order under and the options for the default product, and resolves
// the default "0.50in Bleed" option. Places no orders.
//
//   node --env-file=.env.local --import tsx scripts/lumaprints-check.ts
import {
  DEFAULT_OPTIONS,
  DEFAULT_SUBCATEGORY_ID,
  getStores,
  getSubcategoryOptions,
  lumaprintsConfig,
  resolveOptionIds,
} from "../src/lib/lumaprints";

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
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
