import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wpFetch } from "@/lib/woo/client.server";
import type { WPPost } from "@/lib/woo/types";
import { adaptYoast } from "@/lib/woo/types";

interface RawWPPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  yoast_head_json?: Parameters<typeof adaptYoast>[0];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string; alt_text?: string }>;
    author?: Array<{ name: string }>;
  };
}

function adapt(p: RawWPPost): WPPost {
  const media = p._embedded?.["wp:featuredmedia"]?.[0];
  const author = p._embedded?.author?.[0];
  return {
    id: p.id,
    slug: p.slug,
    date: p.date,
    title: p.title?.rendered ?? "",
    excerpt: p.excerpt?.rendered ?? "",
    content: p.content?.rendered ?? "",
    featuredImage: media?.source_url ?? null,
    author: author?.name ?? null,
    seo: adaptYoast(p.yoast_head_json),
  };
}

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(20).default(9),
        search: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const res = await wpFetch<RawWPPost[]>("/wp-json/wp/v2/posts", {
      query: {
        page: data.page,
        per_page: data.perPage,
        search: data.search,
        _embed: "wp:featuredmedia,author",
      },
    });
    return {
      items: (res.data ?? []).map(adapt),
      total: res.totalItems,
      totalPages: res.totalPages,
      page: data.page,
    };
  });

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<WPPost | null> => {
    const res = await wpFetch<RawWPPost[]>("/wp-json/wp/v2/posts", {
      query: { slug: data.slug, per_page: 1, _embed: "wp:featuredmedia,author" },
    });
    const first = res.data?.[0];
    return first ? adapt(first) : null;
  });