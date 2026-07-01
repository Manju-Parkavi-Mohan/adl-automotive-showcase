import type { SeoMeta } from "@/lib/woo/types";

/** Build a TanStack head() meta array from Yoast SEO metadata, with fallbacks. */
export function seoToMeta(
  seo: SeoMeta | undefined,
  fallback: { title: string; description?: string; image?: string },
): Array<Record<string, string>> {
  const title = seo?.title ?? fallback.title;
  const description = seo?.description ?? fallback.description;
  const ogTitle = seo?.ogTitle ?? title;
  const ogDescription = seo?.ogDescription ?? description;
  const ogImage = seo?.ogImage ?? fallback.image;
  const ogType = seo?.ogType ?? "website";
  const twitterCard = seo?.twitterCard ?? "summary_large_image";
  const twitterTitle = seo?.twitterTitle ?? ogTitle;
  const twitterDescription = seo?.twitterDescription ?? ogDescription;
  const twitterImage = seo?.twitterImage ?? ogImage;

  const meta: Array<Record<string, string>> = [{ title }];
  if (description) meta.push({ name: "description", content: description });
  if (seo?.robots) meta.push({ name: "robots", content: seo.robots });
  meta.push({ property: "og:title", content: ogTitle });
  if (ogDescription) meta.push({ property: "og:description", content: ogDescription });
  meta.push({ property: "og:type", content: ogType });
  if (ogImage) meta.push({ property: "og:image", content: ogImage });
  meta.push({ name: "twitter:card", content: twitterCard });
  meta.push({ name: "twitter:title", content: twitterTitle });
  if (twitterDescription) meta.push({ name: "twitter:description", content: twitterDescription });
  if (twitterImage) meta.push({ name: "twitter:image", content: twitterImage });
  return meta;
}

export function seoToLinks(seo: SeoMeta | undefined): Array<{ rel: string; href: string }> {
  return seo?.canonical ? [{ rel: "canonical", href: seo.canonical }] : [];
}