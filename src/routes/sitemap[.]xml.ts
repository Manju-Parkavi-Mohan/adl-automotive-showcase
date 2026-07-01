import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * Proxies the WordPress backend sitemap (Yoast / core WP sitemap) so the
 * storefront exposes `/sitemap.xml` sourced from the CMS. Yoast typically
 * serves `/sitemap_index.xml`; we try that first, then fall back to
 * `/wp-sitemap.xml` (WP core).
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const site = process.env.WORDPRESS_SITE_URL?.replace(/\/+$/, "");
        if (!site) {
          return new Response("Sitemap unavailable", { status: 503 });
        }
        const candidates = [`${site}/sitemap_index.xml`, `${site}/wp-sitemap.xml`];
        for (const url of candidates) {
          try {
            const res = await fetch(url, { headers: { Accept: "application/xml" } });
            if (res.ok) {
              const xml = await res.text();
              return new Response(xml, {
                headers: {
                  "Content-Type": "application/xml; charset=utf-8",
                  "Cache-Control": "public, max-age=3600",
                },
              });
            }
          } catch {
            // try next candidate
          }
        }
        return new Response("Sitemap not found", { status: 502 });
      },
    },
  },
});