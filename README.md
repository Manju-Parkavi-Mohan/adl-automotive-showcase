# ADL Automotive

A premium international automotive e-commerce platform for diagnostic tools, ECU programming equipment, and tuning software. Built as a client-ready prototype with a clean, professional UI and full WooCommerce/WordPress backend integration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19 + Vite + SSR) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript (strict mode) |
| UI Components | Radix UI primitives + custom components |
| State & Data | TanStack Query |
| Backend API | WooCommerce REST API v3 + WordPress REST API |
| Authentication | JWT via WordPress |
| SEO | Yoast SEO (WordPress plugin) — metadata, Open Graph, JSON-LD schema |

## Features

- **Product Catalog** — Browse, filter, sort, and search products with grid/list view
- **Product Detail** — Image gallery, specifications, reviews, related products
- **Cart & Checkout** — Full shopping cart flow with quantity management
- **User Accounts** — Registration, login, order history, saved addresses
- **Order Details** — View individual order status, items, billing & shipping info
- **Reviews** — Authenticated users can submit product ratings and comments
- **Blog** — Paginated blog posts pulled from WordPress
- **SEO Ready** — Server-side rendered with Yoast metadata, sitemap.xml, robots.txt
- **Mobile Optimized** — Responsive design with mobile-first grid layouts

## Prerequisites

- [Bun](https://bun.sh) or Node.js 20+
- A WooCommerce store with REST API enabled
- WordPress with the [Yoast SEO](https://yoast.com/wordpress/plugins/seo/) plugin (optional but recommended)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Install dependencies

This repository is configured to run standalone from GitHub using public npm packages only.

```bash
bun install
# or
npm install
```

If you previously installed before this standalone setup, reset your local install once:

```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `WORDPRESS_SITE_URL` | Yes | Your WordPress site URL (e.g., `https://yourstore.com`) |
| `WOOCOMMERCE_CONSUMER_KEY` | Yes | WooCommerce REST API consumer key |
| `WOOCOMMERCE_CONSUMER_SECRET` | Yes | WooCommerce REST API consumer secret |
| `SESSION_SECRET` | Yes | Random string for signing session cookies (min 32 chars) |

> **How to get WooCommerce keys:**
> 1. In your WordPress admin, go to **WooCommerce → Settings → Advanced → REST API**
> 2. Click **Add key**, give it a description, set permissions to **Read/Write**
> 3. Copy the **Consumer key** and **Consumer secret**

> **How to generate SESSION_SECRET:**
> ```bash
> openssl rand -base64 32
> ```

### 4. Run locally

```bash
bun run dev:standalone
# or
npm run dev:standalone
```

The app will be available at `http://localhost:8080`.

### 5. Build for production

```bash
bun run build:standalone
# or
npm run build:standalone
```

## Project Structure

```
src/
├── components/
│   ├── site/           # Page-level sections (Header, Footer, Hero, etc.)
│   └── ui/             # Reusable UI primitives (Button, Card, Dialog, etc.)
├── lib/
│   ├── woo/            # WooCommerce API connector & adapters
│   ├── wp/             # WordPress/Yoast SEO helpers
│   ├── auth/           # JWT session & auth utilities
│   └── seo.ts          # SEO metadata mapping
├── routes/             # TanStack file-based routes
│   ├── index.tsx       # Homepage
│   ├── products.tsx    # Product listing
│   ├── products.$productId.tsx  # Product detail
│   ├── cart.tsx        # Shopping cart
│   ├── checkout.tsx    # Checkout flow
│   ├── account.*.tsx   # Auth & dashboard routes
│   ├── blog.*.tsx      # Blog listing & posts
│   ├── sitemap[.]xml.ts
│   └── robots[.]txt.ts
├── styles.css          # Tailwind v4 global styles & theme tokens
└── router.tsx          # TanStack Router bootstrap
```

## WooCommerce Integration Notes

- The app fetches **products**, **categories**, **orders**, **customers**, and **reviews** directly from the WooCommerce REST API.
- **Images**: Product images are served from your WordPress media library. If images appear broken, ensure your WordPress site does not block external referrers.
- **Orders**: Logged-in users see orders matched by both their WordPress user ID and their billing email address (so guest checkout orders tied to the same email also appear).
- **Yoast SEO**: If installed, the app reads page titles, meta descriptions, Open Graph tags, Twitter cards, and JSON-LD schema automatically for every route.

## SEO

This application is built for SEO teams:

- **SSR (Server-Side Rendering)**: All pages render fully on the server so search crawlers receive complete HTML.
- **Yoast SEO Compatible**: If you use the Yoast SEO plugin in WordPress, all metadata (title, description, Open Graph, Twitter cards, canonical URLs, JSON-LD schema) is consumed automatically.
- **Sitemap & Robots**: `/sitemap.xml` and `/robots.txt` are proxied directly from your WordPress backend.
- You can verify SEO readiness with:
  - [Google Rich Results Test](https://search.google.com/test/rich-results)
  - [PageSpeed Insights](https://pagespeed.web.dev/)
  - [Screaming Frog](https://www.screamingfrog.co.uk/seo-spider/)

## Deployment

This is a standard TanStack Start / Vite application. You can deploy it to any platform that supports Node.js or edge runtimes:

- **Vercel**
- **Netlify**
- **Cloudflare Pages**
- **Railway / Render**

Make sure to configure the same environment variables in your hosting dashboard.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build locally |
| `bun run dev:standalone` | Same as `dev`; kept for compatibility |
| `bun run build:standalone` | Same as `build`; kept for compatibility |
| `bun run preview:standalone` | Same as `preview`; kept for compatibility |
| `bun run lint` | Run ESLint |
| `bun run format` | Run Prettier |

## License

Private — for ADL Automotive client use.
