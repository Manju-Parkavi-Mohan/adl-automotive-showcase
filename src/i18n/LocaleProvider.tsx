import { createContext, useContext, useMemo, type ReactNode } from "react";
import enDict from "./en.json";
import arDict from "./ar.json";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  CURRENCY_COOKIE,
  LOCALE_META,
  formatPrice as fmtPrice,
  type Currency,
  type Locale,
} from "./config";

const DICTS: Record<Locale, Record<string, unknown>> = {
  en: enDict as Record<string, unknown>,
  ar: arDict as Record<string, unknown>,
};

interface LocaleContextValue {
  locale: Locale;
  currency: Currency;
  dir: "ltr" | "rtl";
  t: (path: string, fallback?: string) => string;
  formatPrice: (usdAmount: number) => string;
  setLocale: (l: Locale) => void;
  setCurrency: (c: Currency) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function lookup(dict: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

// One-year sticky cookie. Client-side write; SSR reads it on next request.
function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function LocaleProvider({
  locale,
  currency,
  children,
}: {
  locale: Locale;
  currency: Currency;
  children: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
    const fallbackDict = DICTS[DEFAULT_LOCALE];
    return {
      locale,
      currency,
      dir: LOCALE_META[locale].dir,
      t: (path, fb) => lookup(dict, path) ?? lookup(fallbackDict, path) ?? fb ?? path,
      formatPrice: (usd) => fmtPrice(usd, currency, locale),
      setLocale: (l) => {
        writeCookie(LOCALE_COOKIE, l);
        if (typeof window !== "undefined") window.location.reload();
      },
      setCurrency: (c) => {
        writeCookie(CURRENCY_COOKIE, c);
        if (typeof window !== "undefined") window.location.reload();
      },
    };
  }, [locale, currency]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Safe fallback so components can be rendered in isolation (tests, storybook)
    return {
      locale: DEFAULT_LOCALE,
      currency: DEFAULT_CURRENCY,
      dir: "ltr",
      t: (p, fb) => fb ?? p,
      formatPrice: (usd) => fmtPrice(usd, DEFAULT_CURRENCY, DEFAULT_LOCALE),
      setLocale: () => {},
      setCurrency: () => {},
    };
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}