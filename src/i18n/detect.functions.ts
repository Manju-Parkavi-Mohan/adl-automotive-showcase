import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  CURRENCY_COOKIE,
  SUPPORTED_LOCALES,
  currencyForCountry,
  localeForCountry,
  isCurrency,
  isLocale,
  type Currency,
  type Locale,
} from "./config";

export interface DetectedI18n {
  locale: Locale;
  currency: Currency;
  country: string | null;
  /** source that decided the locale, useful for debugging / analytics */
  localeSource: "cookie" | "header" | "geo" | "default";
  /** request pathname (no trailing slash except for "/") with any `/en` or `/ar` prefix stripped. */
  path: string;
  /** lang prefix present in the URL, or null when served at the root. */
  urlLocale: Locale | null;
}

function parseAcceptLanguage(header: string | undefined | null): Locale | null {
  if (!header) return null;
  // e.g. "ar-AE,ar;q=0.9,en;q=0.8"
  const parts = header
    .split(",")
    .map((p) => {
      const [tag, q] = p.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of parts) {
    const base = tag.split("-")[0];
    if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return null;
}

/**
 * Server-side locale + currency detection. Runs during SSR from the root loader.
 * Priority for locale: cookie → Accept-Language → CF-IPCountry → default (en).
 * Priority for currency: cookie → CF-IPCountry → USD.
 * The URL segment (`/en`, `/ar`) is handled by the calling code so we
 * accept a hint parameter.
 */
export const detectI18n = createServerFn({ method: "GET" })
  .inputValidator((input?: { urlLocale?: string | null }) => ({
    urlLocale: input?.urlLocale ?? null,
  }))
  .handler(async ({ data }): Promise<DetectedI18n> => {
    const country =
      (getRequestHeader("cf-ipcountry") as string | undefined) ??
      (getRequestHeader("x-vercel-ip-country") as string | undefined) ??
      null;

    // Read the incoming request URL to figure out the URL locale prefix + clean path.
    let rawPath = "/";
    try {
      const url = getRequestUrl();
      if (url) rawPath = new URL(url).pathname || "/";
    } catch {
      // ignore — non-request context
    }
    let urlLocale: Locale | null = null;
    let cleanPath = rawPath;
    const seg = rawPath.split("/")[1];
    if (isLocale(seg)) {
      urlLocale = seg;
      cleanPath = rawPath.slice(seg.length + 1) || "/";
    }
    if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
      cleanPath = cleanPath.replace(/\/+$/, "") || "/";
    }

    // Locale resolution
    let locale: Locale = DEFAULT_LOCALE;
    let localeSource: DetectedI18n["localeSource"] = "default";

    if (urlLocale) {
      locale = urlLocale;
      localeSource = "cookie";
    } else if (isLocale(data.urlLocale)) {
      locale = data.urlLocale;
      localeSource = "cookie"; // treat as sticky
    } else {
      const cookieLocale = getCookie(LOCALE_COOKIE);
      if (isLocale(cookieLocale)) {
        locale = cookieLocale;
        localeSource = "cookie";
      } else {
        const headerLocale = parseAcceptLanguage(
          getRequestHeader("accept-language") as string | undefined,
        );
        if (headerLocale) {
          locale = headerLocale;
          localeSource = "header";
        } else if (country) {
          locale = localeForCountry(country);
          localeSource = "geo";
        }
      }
    }

    // Currency resolution
    let currency: Currency = DEFAULT_CURRENCY;
    const cookieCurrency = getCookie(CURRENCY_COOKIE);
    if (isCurrency(cookieCurrency)) currency = cookieCurrency;
    else currency = currencyForCountry(country);

    return {
      locale,
      currency,
      country: country ?? null,
      localeSource,
      path: cleanPath,
      urlLocale,
    };
  });