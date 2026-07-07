import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight, Heart, Minus, Plus, Share2, ShoppingCart, Star, Check, ZoomIn,
  Truck, ShieldCheck, RotateCcw, Headphones,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionHeader } from "@/components/site/CategoryShowcase";
import { useCart } from "@/components/site/CartProvider";
import { toast } from "sonner";
import { getProduct, getRelatedProducts } from "@/lib/woo/products.functions";
import { wooToDisplay } from "@/lib/woo/adapter";
import { CATEGORY_META } from "@/data/products";
import type { WooProduct } from "@/lib/woo/types";
import { pushRecentlyViewed } from "@/lib/recently-viewed";
import { seoToMeta, seoToLinks, seoToScripts } from "@/lib/seo";
import { ProductReviews } from "@/components/site/ProductReviews";
import { Money, Percent, Num } from "@/components/site/Money";
import { useLocale } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/{-$lang}/products/$productId")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["wc-product", params.productId],
      queryFn: () => getProduct({ data: { idOrSlug: params.productId } }),
      staleTime: 60_000,
    }),
  head: ({ loaderData }) => {
    const woo = loaderData as WooProduct | null | undefined;
    if (!woo) return { meta: [{ title: "Product — ADL Automotive" }] };
    const fallback = {
      title: `${woo.name} — ADL Automotive`,
      description:
        woo.short_description?.replace(/<[^>]+>/g, "").trim() ||
        woo.description?.replace(/<[^>]+>/g, "").trim() ||
        undefined,
      image: woo.images[0]?.src,
    };
    return {
      meta: seoToMeta(woo.seo, fallback),
      links: seoToLinks(woo.seo),
      scripts: seoToScripts(woo.seo),
    };
  },
  notFoundComponent: NotFoundView,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <p role="alert">{error.message}</p>
    </div>
  ),
  component: ProductDetailPage,
});

function NotFoundView() {
  // t() inside functional component; simple English fallback fine here
  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">The product you are looking for is unavailable.</p>
        <Link to="/{-$lang}/products" search={{}} className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Browse all products
        </Link>
      </div>
    </div>
  );
}

const TAB_IDS = ["description", "specs", "reviews"] as const;

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { addItem } = useCart();
  const { t } = useLocale();
  const TABS = [
    { id: "description" as const, label: t("product.tabDescription") },
    { id: "specs" as const, label: t("product.tabSpecs") },
    { id: "reviews" as const, label: t("product.tabReviews") },
  ];

  const productQuery = useQuery({
    queryKey: ["wc-product", productId],
    queryFn: () => getProduct({ data: { idOrSlug: productId } }),
    staleTime: 60_000,
  });

  const woo = productQuery.data ?? null;

  useEffect(() => {
    if (woo?.id) pushRecentlyViewed(woo.id);
  }, [woo?.id]);
  const product = useMemo(() => (woo ? wooToDisplay(woo) : null), [woo]);

  const relatedQuery = useQuery({
    queryKey: ["wc-related", woo?.id],
    queryFn: () => getRelatedProducts({ data: { productId: woo!.id, limit: 4 } }),
    enabled: !!woo?.id,
  });

  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof TAB_IDS)[number]>("description");

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-px mx-auto max-w-[1400px] py-24 text-center text-sm text-muted-foreground">
          {t("product.loading")}
        </div>
        <Footer />
      </div>
    );
  }

  if (!product || !woo) return <NotFoundView />;

  const gallery = woo.images.length > 0 ? woo.images.map((i) => i.src) : [product.image];
  const safeIndex = Math.min(imageIndex, gallery.length - 1);

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleAdd = () => {
    addItem(
      {
        productId: woo.id,
        slug: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        brand: product.brand,
      },
      qty,
    );
    toast.success(`${product.name} added to cart`);
  };

  const related = (relatedQuery.data ?? []).map(wooToDisplay);
  const categoryLabel = woo.categories[0]?.name ?? CATEGORY_META[product.category].label;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b border-border bg-secondary">
        <div className="container-px mx-auto max-w-[1400px] py-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link to="/{-$lang}" className="hover:text-primary">{t("common.home")}</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><Link to="/{-$lang}/products" search={{}} className="hover:text-primary">{t("nav.products")}</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><span className="text-muted-foreground">{categoryLabel}</span></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="line-clamp-1 max-w-xs font-medium text-foreground">{product.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="container-px mx-auto max-w-[1400px] py-10">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_460px] xl:grid-cols-[minmax(0,1.15fr)_500px] xl:gap-14">
          <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
            <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-secondary transition-colors ${
                    i === safeIndex ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="group relative order-1 aspect-square overflow-hidden rounded-xl border border-border bg-secondary sm:order-2">
              <img
                src={gallery[safeIndex]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute start-4 top-4 flex flex-col gap-2">
                {product.badge === "new" && (
                  <span className="rounded-full bg-[var(--accent-blue)] px-3 py-1 text-xs font-semibold text-white">{t("product.new")}</span>
                )}
                {discount > 0 && (
                  <span className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-white"><Percent value={discount} sign="-" /> {t("product.off")}</span>
                )}
              </div>
              <div className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-foreground shadow-sm">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
              {product.brand} · {categoryLabel}
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
                <span className="font-semibold text-foreground"><Num>{product.rating.toFixed(1)}</Num></span>
                <span className="text-muted-foreground">({t("product.reviewsCount", { count: product.reviewCount })})</span>
              </div>
              <span className="text-muted-foreground">{t("product.sku")}: <span className="font-medium text-foreground"><Num>{product.sku}</Num></span></span>
              <span className={`inline-flex items-center gap-1.5 font-medium ${product.inStock ? "text-emerald-600" : "text-destructive"}`}>
                <Check className="h-4 w-4" /> {product.inStock ? t("product.inStock") : t("product.outOfStock")}
              </span>
            </div>

            {product.description && (
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">{product.description}</p>
            )}

            <div className="mt-6 rounded-xl border border-border bg-secondary p-6">
              <div className="flex flex-wrap items-end gap-3">
                <Money usd={product.price} className="text-4xl font-extrabold text-primary" />
                {product.oldPrice && (
                  <>
                    <Money usd={product.oldPrice} strike className="text-lg text-muted-foreground" />
                    <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                      {t("product.save")} <Money usd={product.oldPrice - product.price} />
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t("product.vatIncluded")}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex h-12 items-center rounded-md border border-border bg-white">
                  <button aria-label={t("product.decrease")} onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-full w-11 place-items-center text-muted-foreground hover:text-primary">
                    <Minus className="h-4 w-4" />
                  </button>
                  <input aria-label={t("product.quantity")} type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="h-full w-12 border-x border-border bg-transparent text-center text-sm font-semibold outline-none" />
                  <button aria-label={t("product.increase")} onClick={() => setQty((q) => q + 1)} className="grid h-full w-11 place-items-center text-muted-foreground hover:text-primary">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={handleAdd} disabled={!product.inStock} className="inline-flex h-12 flex-1 min-w-[200px] items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                  <ShoppingCart className="h-4 w-4" />
                  {product.inStock ? t("product.addToCart") : t("product.outOfStock")}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button className="inline-flex h-11 flex-1 min-w-[160px] items-center justify-center gap-2 rounded-md border border-border bg-white text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
                  <Heart className="h-4 w-4" /> {t("product.addToWishlist")}
                </button>
                <button className="inline-flex h-11 flex-1 min-w-[160px] items-center justify-center gap-2 rounded-md border border-border bg-white text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
                  <Share2 className="h-4 w-4" /> {t("product.share")}
                </button>
              </div>
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: Truck, label: t("product.features.shipping") },
                { icon: ShieldCheck, label: t("product.features.genuine") },
                { icon: RotateCcw, label: t("product.features.returns") },
                { icon: Headphones, label: t("product.features.support") },
              ].map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 rounded-md border border-border bg-white px-3 py-2.5">
                  <f.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/80">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <div className="border-b border-border">
            <div className="flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`relative px-5 py-3 text-sm font-semibold transition-colors ${tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {t.label}
                  {tab === t.id && (<span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />)}
                </button>
              ))}
            </div>
          </div>
          <div className="py-8">
            {tab === "description" && <DescriptionPanel woo={woo} />}
            {tab === "specs" && <SpecsPanel woo={woo} />}
            {tab === "reviews" && (
              <ProductReviews productId={woo.id} rating={product.rating} reviewCount={product.reviewCount} />
            )}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeader eyebrow={t("product.relatedEyebrow")} title={t("product.relatedTitle")}
            action={<Link to="/{-$lang}/products" search={{}} className="text-sm font-semibold text-primary hover:underline">{t("common.viewAllArrow")}</Link>} />
          {related.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{t("product.noRelated")}</p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DescriptionPanel({ woo }: { woo: WooProduct }) {
  const html = woo.description || woo.short_description;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="prose prose-slate max-w-none text-foreground/85" dangerouslySetInnerHTML={{ __html: html || "<p>No description provided.</p>" }} />
      <aside className="h-fit rounded-xl border border-border bg-secondary p-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Quick facts</h4>
        <ul className="mt-3 space-y-2 text-sm text-foreground/80">
          <li>• SKU: <span className="font-medium text-foreground">{woo.sku}</span></li>
          {woo.brand && <li>• Brand: <span className="font-medium text-foreground">{woo.brand}</span></li>}
          <li>• Total sales: <span className="font-medium text-foreground">{woo.total_sales}</span></li>
          <li>• Stock: <span className="font-medium text-foreground">{woo.stock_status}</span></li>
        </ul>
      </aside>
    </div>
  );
}

function SpecsPanel({ woo }: { woo: WooProduct }) {
  const baseRows: Array<[string, string]> = [
    ["SKU", woo.sku || "—"],
    ["Brand", woo.brand ?? "—"],
    ["Categories", woo.categories.map((c) => c.name).join(", ") || "—"],
    ["Stock status", woo.stock_status],
    ["Total sales", String(woo.total_sales)],
  ];
  const attrRows: Array<[string, string]> = woo.attributes.map((a) => [a.name, a.options.join(", ")]);
  const rows = [...baseRows, ...attrRows];
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row[0]}-${i}`} className={i % 2 === 0 ? "bg-secondary" : "bg-white"}>
              <th scope="row" className="w-1/3 px-5 py-3.5 text-start font-semibold text-foreground">{row[0]}</th>
              <td className="px-5 py-3.5 text-foreground/80">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

