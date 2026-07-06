import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { langUrl } from "@/i18n/seo";
import { listProducts } from "@/lib/woo/products.functions";

export interface SitemapEntry {
  path: string;
  changefreq?: string;
  priority?: string;
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/products", changefreq: "daily", priority: "0.9" },
    { path: "/blog", changefreq: "weekly", priority: "0.7" },
    { path: "/cart", changefreq: "monthly", priority: "0.3" },
    { path: "/account/login", changefreq: "monthly", priority: "0.3" },
    { path: "/account/register", changefreq: "monthly", priority: "0.3" },
  ];
  try {
    const products = await listProducts({ data: { perPage: 100 } });
    for (const p of products.items) {
      entries.push({ path: `/products/${p.slug}`, changefreq: "weekly", priority: "0.8" });
    }
  } catch {
    // WordPress unavailable — return static entries only.
  }
  return entries;
}

export function renderSitemapXml(locale: Locale, entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    const alt = SUPPORTED_LOCALES.map(
      (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${langUrl(l, entry.path)}" />`,
    ).join("\n");
    return [
      `  <url>`,
      `    <loc>${langUrl(locale, entry.path)}</loc>`,
      entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
      entry.priority ? `    <priority>${entry.priority}</priority>` : null,
      alt,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${langUrl("en", entry.path)}" />`,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}
