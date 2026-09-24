// Lumaprints print-on-demand API: prints marked "Printed by Lumaprints"
// are ordered here automatically once Stripe confirms payment.
// Docs: https://api-docs.lumaprints.com

// Production has no test mode, and test orders sent there get the API
// key revoked, so the sandbox is the default until LUMAPRINTS_ENV is set.
const BASE_URLS = {
  sandbox: "https://us.api-sandbox.lumaprints.com/api/v1",
  production: "https://us.api.lumaprints.com/api/v1",
} as const;

export type LumaprintsEnv = keyof typeof BASE_URLS;

// Archival Matte Fine Art Paper, what Barbara's Lumaprints products use.
export const DEFAULT_SUBCATEGORY_ID = 103001;
export const DEFAULT_OPTIONS = "0.50in Bleed";

export type LumaprintsConfig = {
  env: LumaprintsEnv;
  baseUrl: string;
  auth: string;
  storeId: number;
  shippingMethod: string;
};

export function lumaprintsConfig(): LumaprintsConfig | null {
  const key = process.env.LUMAPRINTS_API_KEY?.trim();
  const secret = process.env.LUMAPRINTS_API_SECRET?.trim();
  const storeId = Number(process.env.LUMAPRINTS_STORE_ID);
  if (!key || !secret || !storeId) return null;
  const env: LumaprintsEnv =
    process.env.LUMAPRINTS_ENV?.trim() === "production" ? "production" : "sandbox";
  return {
    env,
    baseUrl: BASE_URLS[env],
    auth: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
    storeId,
    // USPS Ground Advantage: $6.67 for a 6×6 print to New York in
    // September 2026, inside the flat print shipping charged at checkout.
    shippingMethod:
      process.env.LUMAPRINTS_SHIPPING_METHOD?.trim() || "usps_ground_advantage",
  };
}

export class LumaprintsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LumaprintsError";
  }
}

async function request<T>(
  config: LumaprintsConfig,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: config.auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch (err) {
    throw new LumaprintsError(
      `Could not reach Lumaprints: ${err instanceof Error ? err.message : err}`,
      0,
    );
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "message" in data
        ? JSON.stringify((data as { message: unknown }).message)
        : text.slice(0, 500);
    throw new LumaprintsError(
      `Lumaprints ${init?.method ?? "GET"} ${path} failed (${res.status}): ${detail}`,
      res.status,
    );
  }
  return data as T;
}

export type LumaprintsOptionGroup = {
  optionGroup: string;
  optionGroupItems: { optionId: number; optionName: string }[];
};

export function getSubcategoryOptions(
  config: LumaprintsConfig,
  subcategoryId: number,
) {
  return request<LumaprintsOptionGroup[]>(
    config,
    `/products/subcategories/${subcategoryId}/options`,
  );
}

export function getStores(config: LumaprintsConfig) {
  return request<{ storeId: number; storeName: string }[]>(config, "/stores");
}

/**
 * The admin stores options the way the Lumaprints dashboard shows them
 * ("0.50in Bleed"), so Barbara never has to look up numeric IDs. Numbers
 * pass straight through; names are matched against the subcategory's
 * catalog, and anything unmatched is an error rather than a silent default.
 */
export async function resolveOptionIds(
  config: LumaprintsConfig,
  subcategoryId: number,
  spec: string | undefined,
): Promise<number[]> {
  const wanted = (spec ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (wanted.length === 0) return [];
  const needsCatalog = wanted.some((w) => !/^\d+$/.test(w));
  const items = needsCatalog
    ? (await getSubcategoryOptions(config, subcategoryId)).flatMap(
        (g) => g.optionGroupItems,
      )
    : [];
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return wanted.map((w) => {
    if (/^\d+$/.test(w)) return Number(w);
    const target = normalize(w);
    const match =
      items.find((i) => normalize(i.optionName) === target) ??
      items.find((i) => normalize(i.optionName).startsWith(target));
    if (!match) {
      throw new LumaprintsError(
        `No Lumaprints option named "${w}" for product ${subcategoryId}. Available: ${items
          .map((i) => i.optionName)
          .join("; ")}`,
        400,
      );
    }
    return match.optionId;
  });
}

export type LumaprintsRecipient = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
};

export type LumaprintsOrderItem = {
  externalItemId: string;
  subcategoryId: number;
  quantity: number;
  width: number;
  height: number;
  imageUrl: string;
  optionIds: number[];
};

export async function submitOrder(
  config: LumaprintsConfig,
  order: {
    externalId: string;
    recipient: LumaprintsRecipient;
    items: LumaprintsOrderItem[];
  },
): Promise<string> {
  const res = await request<{ message?: string; orderNumber: string | number }>(
    config,
    "/orders",
    {
      method: "POST",
      body: {
        // Letters, numbers, hyphens and underscores only.
        externalId: order.externalId.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 191),
        storeId: config.storeId,
        shippingMethod: config.shippingMethod,
        productionTime: "regular",
        recipient: order.recipient,
        orderItems: order.items.map((item) => ({
          externalItemId: item.externalItemId,
          subcategoryId: item.subcategoryId,
          quantity: item.quantity,
          width: item.width,
          height: item.height,
          file: { imageUrl: item.imageUrl },
          orderItemOptions: item.optionIds,
        })),
      },
    },
  );
  return String(res.orderNumber);
}

/** Split "Jane Q. Smith" for Lumaprints, which requires both parts. */
export function splitName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Customer", lastName: "-" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "-" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}
