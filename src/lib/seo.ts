import type { SeoMeta } from "@/lib/woo/types";

export interface SeoFallback {
  title: string;
  description?: string;
  keywords?: string | string[];
  image?: string;
  url?: string;
  type?: string;
}

/** Build a TanStack head() meta array from Yoast SEO metadata, with fallbacks. */
export function seoToMeta(
  seo: SeoMeta | undefined,
  fallback: SeoFallback,
): Array<Record<string, string>> {
  const title = seo?.title ?? fallback.title;
  const description = seo?.description ?? fallback.description;
  const keywords = seo?.keywords
    ?? (Array.isArray(fallback.keywords) ? fallback.keywords.join(", ") : fallback.keywords);
  const ogTitle = seo?.ogTitle ?? title;
  const ogDescription = seo?.ogDescription ?? description;
  const ogImage = seo?.ogImage ?? fallback.image;
  const ogType = seo?.ogType ?? fallback.type ?? "website";
  const ogUrl = seo?.ogUrl ?? fallback.url;
  const twitterCard = seo?.twitterCard ?? (ogImage ? "summary_large_image" : "summary");
  const twitterTitle = seo?.twitterTitle ?? ogTitle;
  const twitterDescription = seo?.twitterDescription ?? ogDescription;
  const twitterImage = seo?.twitterImage ?? ogImage;

  const meta: Array<Record<string, string>> = [{ title }];
  if (description) meta.push({ name: "description", content: description });
  if (keywords) meta.push({ name: "keywords", content: keywords });
  if (seo?.author) meta.push({ name: "author", content: seo.author });
  if (seo?.robots) meta.push({ name: "robots", content: seo.robots });

  meta.push({ property: "og:title", content: ogTitle });
  if (ogDescription) meta.push({ property: "og:description", content: ogDescription });
  meta.push({ property: "og:type", content: ogType });
  if (ogUrl) meta.push({ property: "og:url", content: ogUrl });
  if (seo?.ogLocale) meta.push({ property: "og:locale", content: seo.ogLocale });
  if (seo?.ogSiteName) meta.push({ property: "og:site_name", content: seo.ogSiteName });
  if (ogImage) meta.push({ property: "og:image", content: ogImage });

  if (seo?.articlePublishedTime)
    meta.push({ property: "article:published_time", content: seo.articlePublishedTime });
  if (seo?.articleModifiedTime)
    meta.push({ property: "article:modified_time", content: seo.articleModifiedTime });
  if (seo?.articleAuthor)
    meta.push({ property: "article:author", content: seo.articleAuthor });
  if (seo?.articleSection)
    meta.push({ property: "article:section", content: seo.articleSection });
  if (seo?.articleTags) {
    for (const t of seo.articleTags) meta.push({ property: "article:tag", content: t });
  }

  meta.push({ name: "twitter:card", content: twitterCard });
  meta.push({ name: "twitter:title", content: twitterTitle });
  if (twitterDescription) meta.push({ name: "twitter:description", content: twitterDescription });
  if (twitterImage) meta.push({ name: "twitter:image", content: twitterImage });
  if (seo?.twitterSite) meta.push({ name: "twitter:site", content: seo.twitterSite });
  if (seo?.twitterCreator) meta.push({ name: "twitter:creator", content: seo.twitterCreator });
  if (seo?.twitterLabels) {
    seo.twitterLabels.slice(0, 2).forEach((l, i) => {
      meta.push({ name: `twitter:label${i + 1}`, content: l.label });
      meta.push({ name: `twitter:data${i + 1}`, content: l.data });
    });
  }
  return meta;
}

/**
 * @deprecated Canonical + hreflang are now emitted from the root route via
 * `buildLocaleLinks`. Returning `[]` here prevents duplicate canonical tags.
 * Kept for API compatibility with existing callers.
 */
export function seoToLinks(_seo: SeoMeta | undefined): Array<{ rel: string; href: string }> {
  return [];
}

export function seoToScripts(
  seo: SeoMeta | undefined,
): Array<{ type: string; children: string }> {
  return seo?.schemaJson
    ? [{ type: "application/ld+json", children: seo.schemaJson }]
    : [];
}