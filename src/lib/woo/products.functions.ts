import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wcFetch } from "./client.server";
import { adaptProduct, type ProductListResult, type RawWooProduct, type WooProduct } from "./types";

const listSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(), // category slug or id
  orderby: z.enum(["date", "popularity", "rating", "price", "title", "menu_order"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  onSale: z.boolean().optional(),
  featured: z.boolean().optional(),
  include: z.array(z.number()).optional(),
  exclude: z.array(z.number()).optional(),
  brand: z.string().optional(), // comma-joined brand term IDs
  inStock: z.boolean().optional(),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<ProductListResult> => {
    const res = await wcFetch<RawWooProduct[]>("/products", {
      query: {
        page: data.page,
        per_page: data.perPage,
        search: data.search,
        category: data.category,
        orderby: data.orderby,
        order: data.order,
        min_price: data.minPrice,
        max_price: data.maxPrice,
        on_sale: data.onSale,
        featured: data.featured,
        include: data.include?.join(","),
        exclude: data.exclude?.join(","),
        brand: data.brand,
        stock_status: data.inStock ? "instock" : undefined,
        status: "publish",
      },
    });
    return {
      items: (res.data ?? []).map(adaptProduct),
      total: res.totalItems,
      totalPages: res.totalPages,
      page: data.page,
      perPage: data.perPage,
    };
  });

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const res = await wcFetch<{ id: number; name: string; slug: string; count: number }[]>("/products/brands", {
    query: { per_page: 100, hide_empty: true },
  });
  return res.data ?? [];
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ idOrSlug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<WooProduct | null> => {
    const key = data.idOrSlug;
    // numeric → direct id lookup
    if (/^\d+$/.test(key)) {
      try {
        const res = await wcFetch<RawWooProduct>(`/products/${key}`);
        return adaptProduct(res.data);
      } catch {
        return null;
      }
    }
    const res = await wcFetch<RawWooProduct[]>("/products", {
      query: { slug: key, per_page: 1, status: "publish" },
    });
    const first = res.data?.[0];
    return first ? adaptProduct(first) : null;
  });

export const getRelatedProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ productId: z.number().int().positive(), limit: z.number().int().min(1).max(12).default(4) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<WooProduct[]> => {
    // Fetch the product to get its category ids
    const prodRes = await wcFetch<RawWooProduct>(`/products/${data.productId}`);
    const catIds = (prodRes.data.categories ?? []).map((c) => c.id).join(",");
    if (!catIds) return [];
    const res = await wcFetch<RawWooProduct[]>("/products", {
      query: {
        category: catIds,
        per_page: data.limit + 1,
        exclude: String(data.productId),
        status: "publish",
      },
    });
    return (res.data ?? []).map(adaptProduct).slice(0, data.limit);
  });
