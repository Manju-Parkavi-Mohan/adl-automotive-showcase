import { createServerFn } from "@tanstack/react-start";
import { wcFetch } from "./client.server";
import { decodeHtml } from "@/lib/html";

export interface WooBrand {
  id: number;
  name: string;
  slug: string;
  count: number;
  image?: { src: string; alt?: string } | null;
}

interface RawWooBrand {
  id: number;
  name: string;
  slug: string;
  count: number;
  image?: { src: string; alt?: string } | null;
}

export const listBrands = createServerFn({ method: "GET" }).handler(async (): Promise<WooBrand[]> => {
  try {
    const paths = ["/products/brands", "/products/attributes/pa_brand/terms"];
    for (const p of paths) {
      try {
        const res = await wcFetch<RawWooBrand[]>(p, {
          query: { per_page: 100, hide_empty: true, orderby: "name", order: "asc" },
        });
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map((b) => ({
            id: b.id,
            name: decodeHtml(b.name),
            slug: b.slug,
            count: b.count ?? 0,
            image: b.image ? { src: b.image.src, alt: b.image.alt } : null,
          }));
        }
      } catch (err) {
        console.error(`[listBrands] path ${p} failed:`, err);
      }
    }
    return [];
  } catch (err) {
    console.error("[listBrands] unexpected failure:", err);
    return [];
  }
});