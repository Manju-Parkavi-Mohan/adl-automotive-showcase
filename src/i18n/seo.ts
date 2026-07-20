import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "./config";

export const SITE_URL = "https://adl.apaarr.com";

/** Build a language-prefixed absolute URL. Default locale is unprefixed. */
export function langUrl(locale: Locale, cleanPath: string): string {
  const p = cleanPath === "/" ? "" : cleanPath.replace(/\/+$/, "");
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${p}`;
}

/** hreflang + canonical `<link>` entries for a given clean pathname (no lang prefix). */
export function buildLocaleLinks(cleanPath: string, currentLocale: Locale): Array<Record<string, string>> {
  const links: Array<Record<string, string>> = SUPPORTED_LOCALES.map((l) => ({
    rel: "alternate",
    hrefLang: l,
    href: langUrl(l, cleanPath),
  }));
  links.push({ rel: "alternate", hrefLang: "x-default", href: langUrl(DEFAULT_LOCALE, cleanPath) });
  links.push({ rel: "canonical", href: langUrl(currentLocale, cleanPath) });
  return links;
}

/** Absolute self-URL for og:url — always language-prefixed. */
export function ogUrlFor(cleanPath: string, locale: Locale): string {
  return langUrl(locale, cleanPath);
}