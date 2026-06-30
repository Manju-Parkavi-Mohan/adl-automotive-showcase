import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wcFetch } from "./client.server";
import type { WooCategory } from "./types";

interface RawWooCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image: { src: string; alt?: string } | null;
}

export const listCategories = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        perPage: z.number().int().min(1).max(100).default(50),
        parent: z.number().int().optional(),
        hideEmpty: z.boolean().default(true),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<WooCategory[]> => {
    const res = await wcFetch<RawWooCategory[]>("/products/categories", {
      query: {
        per_page: data.perPage,
        parent: data.parent,
        hide_empty: data.hideEmpty,
        orderby: "count",
        order: "desc",
      },
    });
    return (res.data ?? [])
      .filter((c) => c.slug !== "uncategorized")
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parent: c.parent,
        count: c.count,
        image: c.image ? { src: c.image.src, alt: c.image.alt } : null,
      }));
  });