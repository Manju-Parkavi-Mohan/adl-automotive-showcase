
# Stage 2 — Subdirectory URLs, Per-Language SEO

## Goal

Make `/en/*` and `/ar/*` real URLs (not just cookie state), while `/` still serves the default (English) with a canonical pointing to `/en`. Every page gets its own canonical + hreflang alternates + per-language sitemap.

## Approach

Use TanStack Router's optional prefix segment `{-$lang}`. One route file serves all three shapes:
- `/products` (root, resolves to detected locale)
- `/en/products`
- `/ar/products`

Every existing route moves under `src/routes/{-$lang}/…`. Route paths change from `"/products"` to `"/{-$lang}/products"`. `lang` is validated to `"en" | "ar" | undefined` in each route — anything else throws `notFound()`.

## File moves (mechanical rename)

```text
src/routes/
  __root.tsx                       (unchanged)
  robots[.]txt.ts                  (unchanged path)
  sitemap[.]xml.ts                 (rewritten: sitemap index)
  sitemap-en[.]xml.ts              (new: per-locale)
  sitemap-ar[.]xml.ts              (new: per-locale)
  {-$lang}/
    index.tsx                      (was routes/index.tsx)
    cart.tsx
    checkout.tsx
    account.tsx / account.*.tsx
    blog.tsx / blog.*.tsx
    products.tsx / products.*.tsx
```

## Link + navigate rewrites

Every `<Link to="/x">` becomes:

```tsx
<Link to="/{-$lang}/x" params={(prev) => prev}>
```

`params={(prev) => prev}` preserves the current `lang` (undefined at `/`, `"en"` at `/en`, `"ar"` at `/ar`) so the link stays in the same language subtree the user is already browsing. Same shape for `navigate({ to, params })`.

## Root shell

- `RootShell` resolves locale from URL param first (`useParams({ strict: false }).lang`), falling back to loader's detected locale — this makes `<html lang dir>` and `<HeadContent>` match the URL immediately, no client flicker.
- The root `head()` stops emitting site-wide hreflang links (moves to leaf routes so URLs are correct per page).

## Per-route SEO

Each leaf route's `head()` emits:
- `<link rel="canonical" href="https://adl.apaarr.com/{lang}{path}">` — canonical is always the language-prefixed URL, even when served at `/path`. Root `/` canonicals to `/en`.
- `<link rel="alternate" hreflang="en" href=".../en{path}">`
- `<link rel="alternate" hreflang="ar" href=".../ar{path}">`
- `<link rel="alternate" hreflang="x-default" href=".../en{path}">`
- `og:url` self-referencing the language-prefixed URL.

A small helper `buildLocaleLinks(pathTemplate, params)` in `src/i18n/seo.ts` centralizes this so each route just calls it.

## Sitemap

- `sitemap.xml` becomes a **sitemap index** listing `sitemap-en.xml` and `sitemap-ar.xml`.
- Each per-locale sitemap lists that locale's URLs (home, products index, cart, checkout, blog index, account pages) plus dynamic product / blog slugs pulled from WooCommerce and WordPress, with `<xhtml:link rel="alternate" hreflang="…" />` on every `<url>` entry.
- The existing WordPress-sitemap proxy moves aside; if we want to keep it, we expose it at `/wp-sitemap.xml`. For now, replace with the app-generated one.

## Language + currency switcher

- Language switcher navigates to the same route with the new `lang` param instead of just writing a cookie (URL is now the source of truth).
- Currency stays cookie-based (currency isn't a URL concern for SEO).

## Root path (`/`) behavior

Per your Q1 answer: keep serving default English content at `/` AND at `/en`, with `/` canonicalizing to `/en`. No redirect. Same HTML at both URLs; canonical dedupes for Google.

## Out of scope for this pass

- Translated product content (still English from WP until WPML is added).
- Per-locale Yoast SEO (same reason).
- 301 redirects for legacy `?lang=…` URLs — the site never used them.
- Arabic-authored blog posts.

## Risks I'm calling out up-front

- **Bulk sed of Link/navigate calls**: 19 files touched. I'll batch-edit, then verify build + typecheck.
- **`params={(prev) => prev}`** relies on the parent route also having a `lang` param, which it does with `{-$lang}` at the root of the optional prefix — so preservation works site-wide.
- **`account.orders.$orderId.tsx`** now has two params (`lang`, `orderId`); the loader already reads `orderId`, that keeps working.

## Delivery order (single turn if you approve)

1. Create `{-$lang}` directory, move all page routes into it via `mv` — one shell call.
2. sed `createFileRoute("/…")` → `createFileRoute("/{-$lang}/…")` across the moved files.
3. sed `to="/…"` → `to="/{-$lang}/…"` and add `params={(prev) => prev}` across the 19 caller files.
4. Add `src/i18n/seo.ts` with `buildLocaleLinks()` and `canonicalFor()`.
5. Update each leaf route's `head()` to emit canonical + hreflang via the helper.
6. Rewrite `sitemap[.]xml.ts` as an index; add `sitemap-en[.]xml.ts` and `sitemap-ar[.]xml.ts`.
7. Update root shell to resolve locale from URL param first.
8. Update Header language switcher to navigate instead of just cookie-set.
9. Fix typecheck fallout, restart dev server, verify `/`, `/en`, `/ar/products`, and a product detail all render.

Reply **"go"** to build, or tell me what to change.
