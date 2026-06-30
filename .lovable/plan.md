## Goal

Replace the mock `src/data/products.ts` data layer with live data from your WooCommerce store (via the linked Lovable connector gateway) and your WordPress site, add WP/Woo customer authentication, and a working cart + checkout.

## Connectors & secrets

- WooCommerce connector: **linked** (`WOOCOMMERCE_API_KEY` available). All WC REST v3 calls go through `https://connector-gateway.lovable.dev/woocommerce/...`.
- WordPress posts/pages live at `https://<your-site>/wp-json/wp/v2/...`. The WC connector gateway only proxies `/wc/v3`, so I'll add a `WORDPRESS_SITE_URL` secret and call public WP endpoints directly from server functions (read-only, no auth needed for published posts/pages).
- Customer auth requires the **JWT Authentication for WP REST API** plugin on your WP site (free, widely used). I'll add a `WORDPRESS_SITE_URL` secret (same as above) and post credentials server-side to `/wp-json/jwt-auth/v1/token`. You install the plugin; I document the steps.

## What I'll build

### 1. Server data layer (TanStack `createServerFn`)
- `src/lib/woo/client.server.ts` — gateway fetch helper, error normalization.
- `src/lib/woo/products.functions.ts` — `listProducts({ page, perPage, category, search, orderby, minPrice, maxPrice })`, `getProductBySlugOrId`, `getRelatedProducts`.
- `src/lib/woo/categories.functions.ts` — `listCategories`, `listBrands` (from product attributes).
- `src/lib/woo/orders.functions.ts` — `createOrder` (guest + logged-in), `getOrder`.
- `src/lib/wp/posts.functions.ts` — `listPosts`, `getPostBySlug` (public WP REST).
- `src/lib/auth/wp-auth.functions.ts` — `login` (JWT), `register` (Woo `/customers`), `me` (validate token + fetch customer), `logout`.

### 2. Type-safe DTOs
- `src/lib/woo/types.ts` — `WooProduct`, `WooCategory`, `WooOrder`, `WooCustomer`, `WPPost` — narrow DTOs returned from server fns (no raw provider objects across RPC).

### 3. Routes wired to live data (TanStack Query + `ensureQueryData`)
- `/` — homepage `FeaturedProducts`, `NewArrivals`, `ProductSection` fed by live WC queries (best-selling, on-sale, by category).
- `/products` — listing reads filters from URL search params (`validateSearch` + `loaderDeps`), drives WC `?category=&search=&orderby=&min_price=&max_price=&page=`. Sidebar filters populated from `listCategories` + price range. Pagination from WC headers.
- `/products/$productSlug` — switches the param from id to **slug** (matches WC + better SEO). Detail page + related products from same category.
- `/blog`, `/blog/$slug` — new routes for WordPress posts (cards + detail with HTML render).
- `/account/login`, `/account/register`, `/account` — auth pages.
- `/cart`, `/checkout`, `/checkout/success` — cart + WC order creation.

### 4. Cart
- Client-side `CartProvider` (React context + `localStorage`) holding `{ productId, quantity, variationId? }`.
- Header cart icon shows count + drawer.
- Checkout collects billing/shipping + creates a WC order via server fn; if user is logged in the order is linked to their customer id, otherwise it's a guest order. Payment is set to "pending" / cash-on-delivery for now — adding a gateway (Stripe etc.) is a follow-up.

### 5. Auth UX
- Login + register forms, server fns store the JWT in an httpOnly session cookie (`@tanstack/react-start/server` `useSession`). I'll provision a `SESSION_SECRET` secret.
- `_authenticated` layout gate redirecting to `/account/login` for `/account` + `/checkout/*`.
- Header shows "Sign in" or account menu.

### 6. Cleanup
- `src/data/products.ts` kept only for `BRANDS` fallback (and brand pill demo) until real brand attribute is wired, then removed.

## What I need from you

1. **WordPress site URL** for posts + JWT auth — I'll prompt for the `WORDPRESS_SITE_URL` secret.
2. **JWT Auth plugin** installed and activated on your WP site (https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/) with the two `wp-config.php` lines documented in its readme (`JWT_AUTH_SECRET_KEY`, `JWT_AUTH_CORS_ENABLE`).
3. Confirmation that customers should be allowed to self-register (creates a WP user via Woo `/customers` endpoint).

## Out of scope this pass

- Real payment gateway (Stripe / Woo Payments / PayPal) — add after cart + order flow is verified.
- Variable product variation pickers — I'll render a basic variation `<select>` but full attribute swatches are a follow-up.
- WP/Woo write operations beyond order + customer create (reviews, wishlists, etc.).
- Multi-language / multi-currency switching (UI selectors stay decorative).

## Order of operations

1. Add `WORDPRESS_SITE_URL` + `SESSION_SECRET` secrets, woo client + types + product server fns.
2. Convert `/products` and `/products/$slug` to live data + URL search params.
3. Cart context + header drawer + `/cart`.
4. Auth (session, login/register/account pages, `_authenticated` gate).
5. `/checkout` + order creation + `/checkout/success`.
6. Homepage sections + `/blog` routes.
7. Remove dead mock data.

Confirm and I'll start with step 1.
