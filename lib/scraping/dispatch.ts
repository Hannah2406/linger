// Dispatch: try the best extractor for a URL.
//   1. Shopify product JSON (fast, clean)
//   2. Universal OG / JSON-LD scrape
//   3. (Future) site-specific extractors for Amazon, Sephora, etc.

import { fetchAndExtract } from "./og-extractor";
import { tryShopify } from "./shopify-extractor";
import type { ExtractedItem } from "@/lib/types";

export async function extractItem(url: string): Promise<ExtractedItem> {
  const shopify = await tryShopify(url);
  if (shopify && (shopify.name || shopify.price)) return shopify;

  const og = await fetchAndExtract(url);

  // Combine: prefer shopify fields if present, fall back to og.
  if (shopify) {
    return {
      success: og.success || shopify.success,
      name: shopify.name ?? og.name,
      image_url: shopify.image_url ?? og.image_url,
      price: shopify.price ?? og.price,
      store_name: shopify.store_name ?? og.store_name,
      currency: og.currency,
    };
  }

  return og;
}
