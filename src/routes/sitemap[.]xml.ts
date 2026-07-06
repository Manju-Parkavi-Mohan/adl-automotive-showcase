import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SUPPORTED_LOCALES } from "@/i18n/config";
import { SITE_URL } from "@/i18n/seo";

/**
 * Sitemap index — points crawlers at one sitemap per supported language.
 * Each per-locale sitemap enumerates its own URLs with hreflang alternates.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        const sitemaps = SUPPORTED_LOCALES.map(
          (l) => `  <sitemap>\n    <loc>${SITE_URL}/sitemap-${l}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...sitemaps,
          `</sitemapindex>`,
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});