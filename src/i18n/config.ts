// Central i18n & currency configuration.
// Add a new language by (1) adding it here, (2) creating src/i18n/<code>.json.
// Add a new currency by adding it to CURRENCIES + FX_RATES + COUNTRY_CURRENCY.

export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_META: Record<Locale, { label: string; nativeLabel: string; dir: "ltr" | "rtl" }> = {
  en: { label: "English", nativeLabel: "English", dir: "ltr" },
  ar: { label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
};

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "AED"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "USD";

export const CURRENCY_META: Record<Currency, { symbol: string; label: string }> = {
  USD: { symbol: "$", label: "USD $" },
  EUR: { symbol: "€", label: "EUR €" },
  AED: { symbol: "AED", label: "AED د.إ" },
};

// Base currency is USD. Update these periodically or swap for a live-rate server fn.
export const FX_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  AED: 3.6725,
};

// Map ISO country codes → default currency. Anything not listed → USD.
const EU_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);
export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return DEFAULT_CURRENCY;
  const c = country.toUpperCase();
  if (c === "AE") return "AED";
  if (EU_COUNTRIES.has(c)) return "EUR";
  return "USD";
}

// Map ISO country codes → default locale.
export function localeForCountry(country: string | null | undefined): Locale {
  if (!country) return DEFAULT_LOCALE;
  const arabic = new Set(["AE","SA","EG","JO","KW","QA","OM","BH","LB","IQ","SY","YE","MA","DZ","TN","LY","SD","PS"]);
  return arabic.has(country.toUpperCase()) ? "ar" : "en";
}

export const LOCALE_COOKIE = "lc_locale";
export const CURRENCY_COOKIE = "lc_currency";

export function isLocale(x: unknown): x is Locale {
  return typeof x === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(x);
}
export function isCurrency(x: unknown): x is Currency {
  return typeof x === "string" && (SUPPORTED_CURRENCIES as readonly string[]).includes(x);
}

/** Convert USD amount to target currency using static FX table. */
export function convertFromUSD(amountUsd: number, to: Currency): number {
  return amountUsd * FX_RATES[to];
}

/** Format a price already in the target currency. */
export function formatMoney(amount: number, currency: Currency, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const sym = CURRENCY_META[currency].symbol;
    return `${sym} ${amount.toFixed(2)}`;
  }
}

/** Convert from base USD and format in one call. */
export function formatPrice(amountUsd: number, currency: Currency, locale: Locale): string {
  return formatMoney(convertFromUSD(amountUsd, currency), currency, locale);
}