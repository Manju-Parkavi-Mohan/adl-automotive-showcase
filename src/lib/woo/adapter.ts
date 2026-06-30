import type { Product, ProductCategory } from "@/data/products";
import { CATEGORY_META } from "@/data/products";
import type { WooProduct } from "./types";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80";

function resolveCategory(woo: WooProduct): { key: ProductCategory; label: string } {
  const slugs = woo.categories.map((c) => c.slug.toLowerCase());
  const names = woo.categories.map((c) => c.name);
  const match = (needles: string[]) =>
    slugs.some((s) => needles.some((n) => s.includes(n)));

  if (match(["diagnos"])) return { key: "diagnostic", label: CATEGORY_META.diagnostic.label };
  if (match(["program", "ecu-prog"]))
    return { key: "ecu-programming", label: CATEGORY_META["ecu-programming"].label };
  if (match(["tun", "calibrat", "software"]))
    return { key: "ecu-tuning", label: CATEGORY_META["ecu-tuning"].label };

  return {
    key: "diagnostic",
    label: names[0] ?? CATEGORY_META.diagnostic.label,
  };
}

function badge(woo: WooProduct): Product["badge"] {
  if (woo.on_sale) return "sale";
  if (woo.featured) return "best";
  const ageDays = (Date.now() - new Date(woo.date_created).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 45) return "new";
  return undefined;
}

/** Convert a WooCommerce product into the display `Product` used by cards. */
export function wooToDisplay(woo: WooProduct): Product {
  const cat = resolveCategory(woo);
  return {
    id: woo.slug || String(woo.id),
    wcId: woo.id,
    sku: woo.sku,
    name: woo.name,
    brand: woo.brand ?? "ADL",
    category: cat.key,
    categoryLabel: cat.label,
    description:
      woo.short_description?.replace(/<[^>]+>/g, "").trim() ||
      woo.description?.replace(/<[^>]+>/g, "").trim() ||
      "",
    price: woo.price,
    oldPrice:
      woo.on_sale && woo.regular_price > woo.price ? woo.regular_price : undefined,
    currency: "USD",
    image: woo.images[0]?.src ?? FALLBACK_IMG,
    rating: woo.average_rating,
    reviewCount: woo.rating_count,
    tags: [],
    badge: badge(woo),
    inStock: woo.in_stock,
  };
}