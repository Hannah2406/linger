// Tier 1: universal Open Graph + JSON-LD extraction.
// Works for most modern e-commerce sites (Shopify, indie DTC brands, etc.)

import { load } from "cheerio";
import type { ExtractedItem } from "@/lib/types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; LingerBot/1.0; +https://linger.app)";

export async function extractFromHtml(
  url: string,
  html: string
): Promise<ExtractedItem> {
  const $ = load(html);

  const ogTitle =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").first().text() ||
    null;

  const ogImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[property="og:image:url"]').attr("content") ||
    null;

  const ogSite =
    $('meta[property="og:site_name"]').attr("content") ||
    new URL(url).hostname.replace(/^www\./, "");

  const ogPriceMeta =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content") ||
    null;

  const ogCurrency =
    $('meta[property="product:price:currency"]').attr("content") ||
    $('meta[property="og:price:currency"]').attr("content") ||
    "USD";

  let price: number | null = ogPriceMeta ? parseFloat(ogPriceMeta) : null;
  let currency = ogCurrency;

  // JSON-LD: walk every script and recursively look for Product/Offer schemas
  $('script[type="application/ld+json"]').each((_i, el) => {
    if (price !== null) return;
    const raw = $(el).contents().text();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const found = findProductPrice(parsed);
      if (found) {
        price = found.price;
        currency = found.currency || currency;
      }
    } catch {
      // ignore malformed JSON
    }
  });

  return {
    success: true,
    name: ogTitle?.trim() || null,
    image_url: ogImage ? absolutize(url, ogImage) : null,
    price: price && !Number.isNaN(price) && price > 0 ? price : null,
    store_name: ogSite,
    currency,
  };
}

export async function fetchAndExtract(url: string): Promise<ExtractedItem> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return failure(url, `Status ${res.status}`);
    }
    const html = await res.text();
    return await extractFromHtml(url, html);
  } catch (err) {
    return failure(url, err instanceof Error ? err.message : "fetch failed");
  }
}

function failure(url: string, error: string): ExtractedItem {
  let store: string;
  try {
    store = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    store = "";
  }
  return {
    success: false,
    name: null,
    image_url: null,
    price: null,
    store_name: store,
    currency: "USD",
    error,
  };
}

function absolutize(base: string, src: string): string {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

type PriceMatch = { price: number; currency?: string };

function findProductPrice(node: unknown): PriceMatch | null {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductPrice(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;

  // Direct offer
  const type = obj["@type"];
  const types = Array.isArray(type) ? type : [type];

  if (types.includes("Offer") || types.includes("AggregateOffer")) {
    const priceRaw =
      obj["price"] ??
      obj["lowPrice"] ??
      (obj["priceSpecification"] as Record<string, unknown> | undefined)
        ?.["price"];
    const currency =
      (obj["priceCurrency"] as string | undefined) ??
      ((obj["priceSpecification"] as Record<string, unknown> | undefined)
        ?.["priceCurrency"] as string | undefined);
    const num = parsePrice(priceRaw);
    if (num !== null) return { price: num, currency };
  }

  if (types.includes("Product") && obj["offers"]) {
    const found = findProductPrice(obj["offers"]);
    if (found) return found;
  }

  // Recurse into common containers
  for (const key of ["@graph", "offers", "itemListElement", "mainEntity"]) {
    if (key in obj) {
      const found = findProductPrice(obj[key]);
      if (found) return found;
    }
  }

  return null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number") return value > 0 ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}
