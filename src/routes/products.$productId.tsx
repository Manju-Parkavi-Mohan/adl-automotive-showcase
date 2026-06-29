import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronRight, Heart, Minus, Plus, Share2, ShoppingCart, Star, Check,
  Truck, ShieldCheck, RotateCcw, Headphones, ZoomIn,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionHeader } from "@/components/site/CategoryShowcase";
import { PRODUCTS, CATEGORY_META, type Product } from "@/data/products";

export const Route = createFileRoute("/products/$productId")({
  loader: ({ params }) => {
    const product = PRODUCTS.find((p) => p.id === params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: p
        ? [
            { title: `${p.name} — ADL Automotive` },
            { name: "description", content: p.description },
            { property: "og:title", content: `${p.name} — ADL Automotive` },
            { property: "og:description", content: p.description },
            { property: "og:image", content: p.image },
            { property: "og:type", content: "product" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:image", content: p.image },
          ]
        : [{ title: "Product — ADL Automotive" }],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-secondary px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">The product you are looking for is unavailable.</p>
        <Link to="/products" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Browse all products
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <p role="alert">{error.message}</p>
    </div>
  ),
  component: ProductDetailPage,
});

const TABS = [
  { id: "description", label: "Description" },
  { id: "specs", label: "Specifications" },
  { id: "reviews", label: "Reviews" },
] as const;

function ProductDetailPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("description");

  // Build 4 gallery images by reusing the product image plus reference photos
  const gallery = useMemo(() => {
    const extras = PRODUCTS
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 3)
      .map((p) => p.image);
    return [product.image, ...extras];
  }, [product]);

  const related = useMemo(
    () => PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4),
    [product],
  );
  const recentlyViewed = useMemo(
    () => PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4),
    [product],
  );

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary">
        <div className="container-px mx-auto max-w-[1400px] py-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><Link to="/products" className="hover:text-primary">Products</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><a href="#" className="hover:text-primary">{CATEGORY_META[product.category].label}</a></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="line-clamp-1 max-w-xs font-medium text-foreground">{product.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="container-px mx-auto max-w-[1400px] py-10">
        {/* Top section */}
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_460px] xl:grid-cols-[minmax(0,1.15fr)_500px] xl:gap-14">
          {/* Gallery */}
          <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
            <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-secondary transition-colors ${
                    i === imageIndex ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="group relative order-1 aspect-square overflow-hidden rounded-xl border border-border bg-secondary sm:order-2">
              <img
                src={gallery[imageIndex]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {product.badge === "new" && (
                  <span className="rounded-full bg-[var(--accent-blue)] px-3 py-1 text-xs font-semibold text-white">NEW</span>
                )}
                {discount > 0 && (
                  <span className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-white">-{discount}% OFF</span>
                )}
              </div>
              <div className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-foreground shadow-sm">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
              {product.brand} · {CATEGORY_META[product.category].label}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-current" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{product.rating.toFixed(1)}</span>
                <a href="#reviews" className="text-muted-foreground hover:text-primary">
                  ({product.reviewCount} reviews)
                </a>
              </div>
              <span className="text-muted-foreground">SKU: <span className="font-medium text-foreground">{product.sku}</span></span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                <Check className="h-4 w-4" /> {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{product.description}</p>

            {/* Price card */}
            <div className="mt-6 rounded-xl border border-border bg-secondary p-6">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-4xl font-extrabold text-primary">
                  ${product.price.toLocaleString()}
                </span>
                {product.oldPrice && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      ${product.oldPrice.toLocaleString()}
                    </span>
                    <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                      Save ${(product.oldPrice - product.price).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">VAT included · Free shipping on orders over $1,000</p>

              {/* Quantity + CTA */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex h-12 items-center rounded-md border border-border bg-white">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-full w-11 place-items-center text-muted-foreground hover:text-primary"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    aria-label="Quantity"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    className="h-full w-12 border-x border-border bg-transparent text-center text-sm font-semibold outline-none"
                  />
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-full w-11 place-items-center text-muted-foreground hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button className="inline-flex h-12 flex-1 min-w-[200px] items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button className="inline-flex h-11 flex-1 min-w-[160px] items-center justify-center gap-2 rounded-md border border-border bg-white text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
                  <Heart className="h-4 w-4" /> Add to Wishlist
                </button>
                <button className="inline-flex h-11 flex-1 min-w-[160px] items-center justify-center gap-2 rounded-md border border-border bg-white text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>

            {/* Trust strip */}
            <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: Truck, label: "Free worldwide shipping" },
                { icon: ShieldCheck, label: "100% genuine product" },
                { icon: RotateCcw, label: "30-day returns" },
                { icon: Headphones, label: "Expert tech support" },
              ].map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 rounded-md border border-border bg-white px-3 py-2.5">
                  <f.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/80">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tabs */}
        <section className="mt-16">
          <div className="border-b border-border">
            <div className="flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
                    tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {tab === "description" && <DescriptionPanel product={product} />}
            {tab === "specs" && <SpecsPanel product={product} />}
            {tab === "reviews" && <ReviewsPanel product={product} />}
          </div>
        </section>

        {/* Related */}
        <section className="mt-16">
          <SectionHeader
            eyebrow="You may also like"
            title="Related Products"
            action={<Link to="/products" className="text-sm font-semibold text-primary hover:underline">View all →</Link>}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Recently viewed */}
        <section className="mt-16">
          <SectionHeader eyebrow="Continue browsing" title="Recently Viewed" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyViewed.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function DescriptionPanel({ product }: { product: Product }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="prose prose-slate max-w-none text-foreground/85">
        <p className="text-base leading-relaxed">{product.description}</p>
        <p className="mt-4 text-base leading-relaxed">
          The {product.name} is engineered for professional workshop environments and validated against
          dealer-level reference platforms. It ships with multi-language software, USB and wireless
          interfaces where applicable, and a 12-month manufacturer warranty.
        </p>
        <h3 className="mt-6 text-lg font-semibold text-foreground">Key highlights</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            "Full-system diagnostic coverage across European, Asian and American vehicles.",
            "Free firmware updates and protocol expansions for the first 12 months.",
            "Backed by ADL Automotive's certified technical support team.",
            "Designed for daily workshop use — rugged, lightweight and intuitive.",
          ].map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-xl border border-border bg-secondary p-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">In the box</h4>
        <ul className="mt-3 space-y-2 text-sm text-foreground/80">
          <li>• Main diagnostic unit</li>
          <li>• OBD-II diagnostic cable</li>
          <li>• Power adapter (100–240V)</li>
          <li>• USB / data cable</li>
          <li>• Quick-start manual</li>
          <li>• Hard-shell carry case</li>
        </ul>
      </aside>
    </div>
  );
}

function SpecsPanel({ product }: { product: Product }) {
  const rows: Array<[string, string]> = [
    ["SKU", product.sku],
    ["Brand", product.brand],
    ["Category", CATEGORY_META[product.category].label],
    ["Connection", "USB 2.0 / Bluetooth 5.0 / Wi-Fi"],
    ["Supported protocols", "ISO 9141, ISO 14230 (KWP2000), ISO 15765 (CAN), DoIP, J1850"],
    ["Operating voltage", "9 – 18 V DC"],
    ["Operating temperature", "0 °C to 50 °C"],
    ["Storage temperature", "-20 °C to 70 °C"],
    ["Compatibility", product.compatibility?.join(", ") ?? "Universal OBD-II vehicles"],
    ["Software", "Multi-language: EN, ES, FR, DE, IT, PT, AR"],
    ["Warranty", "12 months manufacturer warranty"],
    ["Country of origin", "Manufactured in EU / certified facilities"],
    ["Package weight", "2.4 kg"],
    ["Package dimensions", "42 × 28 × 12 cm"],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[0]} className={i % 2 === 0 ? "bg-secondary" : "bg-white"}>
              <th scope="row" className="w-1/3 px-5 py-3.5 text-left font-semibold text-foreground">
                {row[0]}
              </th>
              <td className="px-5 py-3.5 text-foreground/80">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewsPanel({ product }: { product: Product }) {
  const reviews = [
    { name: "Marco D.", role: "Independent workshop · Italy", rating: 5, date: "2 weeks ago",
      title: "Exactly what a busy bay needs",
      body: "Speed and coverage are class-leading. The interface is snappy and our techs got productive within a day." },
    { name: "Sven K.", role: "Master technician · Germany", rating: 5, date: "1 month ago",
      title: "Excellent build quality",
      body: "Heavy-duty connectors and consistent communication on the bench. ADL support was helpful when we needed extra protocols." },
    { name: "Ahmed R.", role: "Tuning specialist · UAE", rating: 4, date: "3 months ago",
      title: "Great value for the feature set",
      body: "Coverage is wide and updates are frequent. Would love a slightly faster boot-time, otherwise excellent." },
  ];
  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div className="h-fit rounded-xl border border-border bg-secondary p-6 text-center">
        <p className="text-5xl font-extrabold text-primary">{product.rating.toFixed(1)}</p>
        <div className="mt-2 inline-flex items-center gap-0.5 text-amber-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-5 w-5 ${i < Math.round(product.rating) ? "fill-current" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Based on {product.reviewCount} verified reviews</p>
        <div className="mt-5 space-y-1.5 text-left">
          {[5, 4, 3, 2, 1].map((s) => {
            const pct = s === 5 ? 78 : s === 4 ? 16 : s === 3 ? 4 : s === 2 ? 1 : 1;
            return (
              <div key={s} className="flex items-center gap-2 text-xs">
                <span className="w-3 font-semibold text-foreground">{s}</span>
                <Star className="h-3 w-3 fill-current text-amber-500" />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
        <button className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Write a review
        </button>
      </div>

      <ul className="space-y-5">
        {reviews.map((r) => (
          <li key={r.name} className="rounded-xl border border-border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.role}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{r.date}</p>
              </div>
            </div>
            <h4 className="mt-4 text-base font-semibold text-foreground">{r.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}