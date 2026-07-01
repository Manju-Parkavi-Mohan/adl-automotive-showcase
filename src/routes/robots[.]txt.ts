import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * Serves `/robots.txt` sourced from the WordPress backend. Falls back to a
 * sensible default that advertises the storefront-proxied sitemap.
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const site = process.env.WORDPRESS_SITE_URL?.replace(/\/+$/, "");
        const origin = new URL(request.url).origin;

        if (site) {
          try {
            const res = await fetch(`${site}/robots.txt`, { headers: { Accept: "text/plain" } });
            if (res.ok) {
              const text = await res.text();
              // Rewrite any WP-hosted sitemap URLs to the storefront proxy
              // so crawlers hit our /sitemap.xml (which itself proxies WP).
              const rewritten = text.replace(
                /^Sitemap:.*$/gim,
                `Sitemap: ${origin}/sitemap.xml`,
              );
              return new Response(rewritten, {
                headers: {
                  "Content-Type": "text/plain; charset=utf-8",
                  "Cache-Control": "public, max-age=3600",
                },
              });
            }
          } catch {
            // fall through to default
          }
        }

        const fallback = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /account",
          "Disallow: /cart",
          "Disallow: /checkout",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(fallback, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});