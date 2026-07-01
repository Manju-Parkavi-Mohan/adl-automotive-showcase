import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wpFetch } from "@/lib/woo/client.server";
import { adaptYoast, type SeoMeta, type YoastHeadJson } from "@/lib/woo/types";

/**
 * Fetches Yoast SEO metadata for an arbitrary URL on the connected WordPress
 * site via the Yoast REST endpoint (`/wp-json/yoast/v1/get_head?url=`).
 *
 * Use this to inject Yoast-authored title/description/keywords/OG tags into
 * SPA routes that are not backed by a single WP object (home, product list,
 * blog index, cart, checkout, account, etc.).
 */
export const getYoastForUrl = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ path: z.string().default("/") }).parse(input ?? {}))
  .handler(async ({ data }): Promise<SeoMeta | null> => {
    const site = process.env.WORDPRESS_SITE_URL?.replace(/\/+$/, "") ?? "";
    if (!site) return null;
    const path = data.path.startsWith("/") ? data.path : `/${data.path}`;
    const url = `${site}${path}`;
    try {
      const res = await wpFetch<{ json?: YoastHeadJson } & YoastHeadJson>(
        "/wp-json/yoast/v1/get_head",
        { query: { url } },
      );
      // Yoast returns { json: {...}, html: "..." } — prefer .json, else raw.
      const head = (res.data?.json ?? res.data) as YoastHeadJson | undefined;
      return adaptYoast(head) ?? null;
    } catch {
      return null;
    }
  });