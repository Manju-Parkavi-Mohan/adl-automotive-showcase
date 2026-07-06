import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildSitemapEntries, renderSitemapXml } from "@/lib/sitemap-utils";

export const Route = createFileRoute("/sitemap-en.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = renderSitemapXml("en", await buildSitemapEntries());
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
