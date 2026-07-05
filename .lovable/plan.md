
# Multilingual SEO Foundation — Plan

## Goals
- SSR-resolved locale (`en`, `ar`) before any HTML is sent — zero flicker.
- Subdirectory URLs: `/en/...`, `/ar/...`. Root `/` serves English content with `<link rel="canonical" href="…/en">`.
- Auto currency (USD/EUR/AED) from IP, with manual override persisted in cookie.
- Static UI strings live in `src/i18n/en.json` and `src/i18n/ar.json` — never hard-coded in components.
- Full RTL layout when locale = `ar` (`<html dir="rtl">`).
- hreflang + canonical + per-language sitemap on every page.
- WordPress stays English-only for now; the code path for `?lang=` on Woo calls is wired but is a no-op until WPML is added on the WP side.

## Architecture

### 1. Locale + currency detection (server-side, one round trip)

New `createServerFn` `detectLocaleAndCurrency` runs in the root loader:

```text
Priority for locale:
  1. URL segment (/en, /ar)      — from route params
  2. Cookie `lc_locale`           — user override, sticky
  3. Accept-Language header       — first supported match
  4. CF-IPCountry → language map  — AE→ar, else en
  5. Fallback: en

Priority for currency:
  1. Cookie `lc_currency`         — user override
  2. CF-IPCountry → currency map  — AE→AED, EU→EUR, else USD
  3. Fallback: USD
```

Result flows through router context so every route + component can read it via a `useLocale()` / `useCurrency()` hook. `<html lang>` and `<html dir>` are set from this on the SSR shell.

### 2. Route tree (optional-param prefix)

Move existing routes under an optional `{-$lang}` prefix so one file serves `/`, `/en`, and `/ar`:

```text
src/routes/
  __root.tsx                              (unchanged shell + LocaleProvider)
  {-$lang}/
    index.tsx                             (was routes/index.tsx)
    products/
      index.tsx                           (was routes/products.index.tsx)
      $productId.tsx                      (was routes/products.$productId.tsx)
    cart.tsx
    checkout.tsx
    blog/index.tsx, blog.$slug.tsx
    account/... (login, register, orders)
  sitemap[.]xml.ts                        (updated: emits /en/* and /ar/* + hreflang)
  robots[.]txt.ts                         (unchanged; already exposes /sitemap.xml)
```

Each route validates `params.lang` — only `en` | `ar` | `undefined` allowed; anything else throws `notFound()`. `undefined` means "root path" and resolves to the detected locale.

### 3. i18n dictionary + hook

```text
src/i18n/
  index.ts        — types + loader
  en.json         — all static strings, nested by section (nav, footer, product, cart, common)
  ar.json         — Arabic mirror
```

`useT()` hook returns a `t("nav.diagnostics")` function. Strings are bundled per-locale (no runtime fetch, no flash). Adding a new language later = add one JSON file + register in the supported list.

### 4. RTL

- `<html dir="rtl">` when `ar`, set from loader data on the shellComponent.
- Tailwind's logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) replace `ml/mr/pl/pr/left/right` in the header, footer, drawer, and product card in this pass. Deep-page RTL polish for less-visible screens ships in a follow-up.

### 5. Currency

- FX rates: small static table in `src/i18n/currency.ts` (USD is the base; EUR ≈ 0.92, AED = 3.6725 pegged). Configurable in one place; live rates can be swapped in later behind a server fn.
- `formatPrice(amount, currency)` used everywhere prices render — replaces the ad-hoc formatting in `ProductCard`, `ProductListItem`, cart, checkout.
- Currency switcher in the top header (next to the language switcher) writes `lc_currency` cookie and reloads the route so SSR reflects the choice.

### 6. SEO plumbing (per route)

Every leaf route's `head()` emits:
- `<title>` and `<meta name="description">` from the locale dictionary (or WP/Yoast for product pages).
- `<link rel="canonical" href=".../en/products/foo">` — always the language-prefixed URL, even when served at `/products/foo`.
- `<link rel="alternate" hreflang="en" …>`, `<link rel="alternate" hreflang="ar" …>`, `<link rel="alternate" hreflang="x-default" …>` on every page.
- `og:locale` + `og:locale:alternate`.

### 7. Sitemap

`sitemap.xml` becomes a sitemap index pointing at `sitemap-en.xml` and `sitemap-ar.xml`, each emitting the full route list for its language with `xhtml:link` hreflang alternates. Product URLs pulled from WooCommerce as they are today.

### 8. What stays unchanged in v1

- WordPress calls stay English-only. The Woo client gains a `locale` argument that's currently ignored; when WPML is added, flipping one line in `client.server.ts` enables per-language content.
- Product SEO from Yoast: still fetched, still English until WP is multilingual. Arabic product pages show Arabic chrome (nav, buttons, labels) around English product body — clearly acceptable per your answer.
- Existing components keep working; only the strings and price formatter change hands.

## Delivery order (single turn if you approve)

1. i18n dictionary + `useT` + `LocaleProvider`.
2. `detectLocaleAndCurrency` server fn + cookie helpers.
3. Route tree move to `{-$lang}` (mechanical rename; child code unchanged).
4. Root shell reads locale from loader, sets `<html lang dir>`, injects hreflang/canonical.
5. Header/footer swap hard-coded strings for `t(...)` + add language/currency switchers.
6. `formatPrice` swap in ProductCard / ProductListItem / cart / checkout.
7. Sitemap becomes index + per-locale sitemaps.

## Out of scope for this pass (call out now to avoid surprise)

- Full RTL audit of every deep account page — logical utilities land on the visible surfaces first; anything I miss shows up as mirrored padding, not broken layout.
- Live FX rates (uses static table; hook is ready for a server fn swap).
- Translated product content (waiting on WPML on the WP side).
- Arabic-authored blog posts (same reason).
- Per-locale Yoast SEO for products (same reason).

Reply "go" to build, or tell me what to change.
