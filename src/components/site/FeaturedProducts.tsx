import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ProductCard } from "./ProductCard";
import { SectionHeader } from "./CategoryShowcase";
import { listProducts } from "@/lib/woo/products.functions";
import { wooToDisplay } from "@/lib/woo/adapter";
import { useLocale } from "@/i18n/LocaleProvider";

type TabId = "featured" | "popular" | "best";

type ListInput = {
  featured?: boolean;
  perPage?: number;
  orderby?: "date" | "popularity" | "rating" | "price" | "title" | "menu_order";
  order?: "asc" | "desc";
};

const TABS_META: { id: TabId; labelKey: string; query: ListInput }[] = [
  { id: "featured", labelKey: "home.featuredTab", query: { featured: true, perPage: 8 } },
  { id: "best", labelKey: "home.bestSellingTab", query: { orderby: "popularity", perPage: 8 } },
];

export function FeaturedProducts() {
  const { t } = useLocale();
  const TABS = TABS_META;
  const [active, setActive] = useState<TabId>("featured");
  const tab = TABS.find((t) => t.id === active)!;
  const { data, isLoading } = useQuery({
    queryKey: ["wc-tab", active],
    queryFn: () => listProducts({ data: tab.query }),
    staleTime: 60_000,
  });
  // Fallback: if "Featured" returns nothing (no products flagged featured yet),
  // show the latest live products so the store never looks empty.
  const featuredEmpty = active === "featured" && !isLoading && (data?.items?.length ?? 0) === 0;
  const { data: latest } = useQuery({
    queryKey: ["wc-tab-latest"],
    queryFn: () => listProducts({ data: { orderby: "date", order: "desc", perPage: 8 } }),
    enabled: featuredEmpty,
    staleTime: 60_000,
  });
  const source = featuredEmpty ? (latest?.items ?? []) : (data?.items ?? []);
  const products = source.map(wooToDisplay);

  return (
    <section className="container-px mx-auto max-w-[1400px] py-10">
      <SectionHeader
        eyebrow={t("home.featuredEyebrow")}
        title={t("home.featured")}
        subtitle={t("home.featuredSubtitle")}
        action={
          <div className="flex flex-wrap gap-1.5 rounded-full bg-secondary p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        }
      />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          products.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </section>
  );
}

export function NewArrivals() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ["wc-new-arrivals"],
    queryFn: () => listProducts({ data: { orderby: "date", order: "desc", perPage: 4 } }),
    staleTime: 60_000,
  });
  const products = (data?.items ?? []).map(wooToDisplay);
  return (
    <section className="bg-secondary py-20">
      <div className="container-px mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow={t("home.newArrivalsEyebrow")}
          title={t("home.newArrivals")}
          subtitle={t("home.newArrivalsSubtitle")}
          action={
            <Link to="/{-$lang}/products" search={{}} className="text-sm font-semibold text-primary hover:underline">
              {t("common.viewAllArrow")}
            </Link>
          }
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : products.length === 0 ? (
            <EmptyState />
          ) : (
            products.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
      No products to show yet. Add products in your WooCommerce store and they'll appear here.
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-[4/3] w-full animate-pulse bg-secondary" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}
