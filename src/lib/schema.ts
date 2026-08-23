import type { Painting } from "@/data/paintings";
import { PRINT_SHIPPING_RATE, SHIPPING_RATES } from "@/data/paintings";
import { COMMISSION_TIERS } from "@/data/commissions";
import type { BlogPost } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-url";

// Schema.org builders. Every block references the same artist entity by
// @id so Google ties products, articles, and the service back to one
// Person. No FAQPage (Google limits that rich result to government and
// health sites) and no Review markup without the owners' consent.

export const ARTIST_ID = `${SITE_URL}/#artist`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const abs = (path: string) =>
  path.startsWith("http") ? path : new URL(path, SITE_URL).href;
const dollars = (cents: number) => (cents / 100).toFixed(2);
const isPlaceholder = (src: string) => src.includes("placeholder");

export function siteGraph(shareImage?: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": ARTIST_ID,
        name: "Barbara J Demers",
        url: `${SITE_URL}/`,
        jobTitle: "Painter",
        description:
          "Barbara J Demers creates original expressive realism paintings of animals, insects, and the natural world, and paints custom pet and animal portraits on commission. 10% of profits from every original are donated to animal welfare.",
        ...(shareImage ? { image: abs(shareImage) } : {}),
        knowsAbout: [
          "Expressive realism",
          "Acrylic painting",
          "Animal portraiture",
          "Pet portrait commissions",
        ],
        mainEntityOfPage: `${SITE_URL}/about`,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: "Barbara J Demers",
        inLanguage: "en",
        publisher: { "@id": ARTIST_ID },
      },
    ],
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      ...items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: it.name,
        item: `${SITE_URL}${it.path}`,
      })),
    ],
  };
}

export function paintingGraph(p: Painting) {
  const url = `${SITE_URL}/gallery/${p.slug}`;
  const title = p.title.trim();
  const images = p.images.filter((s) => !isPlaceholder(s)).map(abs);
  const image = images[0];
  const subject = p.subject?.trim();
  const shipping = SHIPPING_RATES[p.sizeTier];
  const sizeLabel = `${p.widthIn} × ${p.heightIn} in`;

  const artwork = {
    "@type": "VisualArtwork",
    "@id": `${url}#artwork`,
    name: title,
    url,
    ...(image ? { image: images } : {}),
    description: p.description,
    creator: { "@id": ARTIST_ID },
    dateCreated: String(p.year),
    artform: "Painting",
    artMedium: p.medium,
    artEdition: "1",
    width: { "@type": "Distance", name: `${p.widthIn} in` },
    height: { "@type": "Distance", name: `${p.heightIn} in` },
    genre: "Expressive realism",
    ...(subject ? { keywords: subject } : {}),
  };

  const original = {
    "@type": "Product",
    "@id": `${url}#original`,
    name: `${title} — original ${p.medium.toLowerCase()} painting, ${sizeLabel}`,
    url,
    ...(image ? { image: images } : {}),
    description: p.description,
    sku: p.slug,
    category: "Original paintings",
    brand: { "@type": "Brand", name: "Barbara J Demers" },
    material: p.medium,
    width: { "@type": "QuantitativeValue", value: p.widthIn, unitCode: "INH" },
    height: { "@type": "QuantitativeValue", value: p.heightIn, unitCode: "INH" },
    isRelatedTo: { "@id": `${url}#artwork` },
    offers: {
      "@type": "Offer",
      url,
      price: dollars(p.priceCents),
      priceCurrency: "USD",
      availability: p.sold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ARTIST_ID },
      ...(!p.sold
        ? {
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: {
                "@type": "MonetaryAmount",
                value: dollars(shipping.cents),
                currency: "USD",
              },
              shippingDestination: {
                "@type": "DefinedRegion",
                addressCountry: "US",
              },
            },
          }
        : {}),
    },
  };

  const prints = p.prints?.length
    ? {
        "@type": "ProductGroup",
        "@id": `${url}#prints`,
        name: `${title} — archival giclée prints`,
        url,
        ...(image ? { image: images } : {}),
        description: `Archival giclée prints of the painting ${title} by Barbara J Demers.`,
        brand: { "@type": "Brand", name: "Barbara J Demers" },
        productGroupID: `${p.slug}-prints`,
        variesBy: "https://schema.org/size",
        hasVariant: p.prints.map((opt) => ({
          "@type": "Product",
          sku: `${p.slug}-print-${opt.id}`,
          name: `${title} — giclée print, ${opt.widthIn} × ${opt.heightIn} in`,
          size: `${opt.widthIn} × ${opt.heightIn} in`,
          offers: {
            "@type": "Offer",
            url,
            price: dollars(opt.priceCents),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: {
                "@type": "MonetaryAmount",
                value: dollars(PRINT_SHIPPING_RATE.cents),
                currency: "USD",
              },
              shippingDestination: {
                "@type": "DefinedRegion",
                addressCountry: "US",
              },
            },
          },
        })),
      }
    : null;

  return {
    "@context": "https://schema.org",
    "@graph": [
      artwork,
      original,
      ...(prints ? [prints] : []),
      breadcrumbs([
        { name: "Available Work", path: "/gallery" },
        { name: title, path: `/gallery/${p.slug}` },
      ]),
    ],
  };
}

export function blogPostGraph(post: BlogPost, updatedAt?: string) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        mainEntityOfPage: url,
        url,
        headline: post.title,
        description: post.excerpt,
        ...(post.cover ? { image: abs(post.cover) } : {}),
        datePublished: new Date(post.date).toISOString(),
        dateModified: new Date(updatedAt ?? post.date).toISOString(),
        author: { "@id": ARTIST_ID },
        publisher: { "@id": ARTIST_ID },
        isPartOf: { "@id": WEBSITE_ID },
        inLanguage: "en",
      },
      breadcrumbs([
        { name: "Journal", path: "/blog" },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    ],
  };
}

export function commissionsGraph(image?: string) {
  const url = `${SITE_URL}/commissions`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: "Custom pet and animal portrait painting",
        serviceType: "Custom pet portrait painting",
        url,
        description:
          "Original commissioned paintings of pets and animals in Barbara J Demers's expressive realism style, in acrylic on canvas. Includes progress photos and insured, hand-packed shipping. Most commissions ship within 4 to 6 weeks.",
        provider: { "@id": ARTIST_ID },
        areaServed: "US",
        ...(image ? { image: abs(image) } : {}),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Commission size tiers",
          itemListElement: COMMISSION_TIERS.map((tier) => ({
            "@type": "Offer",
            name: `${tier.label} commission — ${tier.sizeNote.toLowerCase()}`,
            url,
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "PriceSpecification",
              minPrice: tier.priceFromCents / 100,
              priceCurrency: "USD",
            },
            availability: "https://schema.org/InStock",
            itemOffered: {
              "@type": "Service",
              name: `${tier.label} commission`,
              serviceType: `Custom animal portrait painting, ${tier.sizeNote.toLowerCase()}`,
            },
          })),
        },
      },
      breadcrumbs([{ name: "Commissions", path: "/commissions" }]),
    ],
  };
}

export function collectionGraph(opts: {
  path: string;
  name: string;
  description?: string;
  image?: string;
  itemPaths: string[];
}) {
  const url = `${SITE_URL}${opts.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: opts.name,
        ...(opts.description ? { description: opts.description } : {}),
        ...(opts.image ? { image: abs(opts.image) } : {}),
        isPartOf: { "@id": WEBSITE_ID },
        author: { "@id": ARTIST_ID },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: opts.itemPaths.length,
          itemListElement: opts.itemPaths.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}${p}`,
          })),
        },
      },
      breadcrumbs([{ name: opts.name, path: opts.path }]),
    ],
  };
}

export function profileGraph() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}/about`,
    name: "About Barbara J Demers",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": ARTIST_ID },
  };
}
