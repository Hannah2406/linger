// Tier 2: Shopify product JSON. Most indie DTC brands run on Shopify and
// expose /products/<handle>.json with clean product data.

import type { ExtractedItem } from "@/lib/types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; LingerBot/1.0; +https://linger.app)";

export function shopifyJsonUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/^(\/.*\/products\/[a-z0-9][a-z0-9-]*)/i);
    if (!match) return null;
    return `${u.origin}${match[1]}.json`;
  } catch {
    return null;
  }
}

export async function tryShopify(
  url: string
): Promise<ExtractedItem | null> {
  const jsonUrl = shopifyJsonUrl(url);
  if (!jsonUrl) return null;

  try {
    const res = await fetch(jsonUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ShopifyProductResponse;
    const product = data.product;
    if (!product) return null;

    const variant = product.variants?.[0];
    const price = variant?.price ? parseFloat(variant.price) : null;
    const image = product.images?.[0]?.src ?? null;

    return {
      success: true,
      name: product.title ?? null,
      image_url: image,
      price: price && !Number.isNaN(price) && price > 0 ? price : null,
      store_name: product.vendor ?? new URL(url).hostname.replace(/^www\./, ""),
      currency: "USD",
    };
  } catch {
    return null;
  }
}

type ShopifyProductResponse = {
  product?: {
    title?: string;
    vendor?: string;
    images?: { src?: string }[];
    variants?: { price?: string }[];
  };
};
