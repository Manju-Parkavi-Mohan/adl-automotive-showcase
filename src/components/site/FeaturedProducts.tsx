import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "./ProductCard";
import { SectionHeader } from "./CategoryShowcase";
import { getBestSellers, getFeatured, getNewArrivals, getOnSale } from "@/data/products";
import { listProducts } from "@/lib/woo/products.functions";
import { wooToDisplay } from "@/lib/woo/adapter";
import type { Product } from "@/data/products";

type TabId = "featured" | "popular" | "best" | "rated";

type ListInput = {
  featured?: boolean;
  perPage?: number;
  orderby?: "date" | "popularity" | "rating" | "price" | "title" | "menu_order";
  order?: "asc" | "desc";
};

const TABS: { id: TabId; label: string; query: ListInput; fallback: () => Product[] }[] = [
  { id: "featured", label: "Featured", query: { featured: true, perPage: 8 }, fallback: () => getFeatured(8) },
  { id: "popular", label: "Popular", query: { orderby: "popularity", perPage: 8 }, fallback: () => getBestSellers(8) },
  { id: "best", label: "Best Selling", query: { orderby: "popularity", perPage: 8 }, fallback: () => getBestSellers(8) },
  { id: "rated", label: "Top Rated", query: { orderby: "rating", perPage: 8 }, fallback: () => getFeatured(8) },
];

export function FeaturedProducts() {
  const [active, setActive] = useState<TabId>("featured");
  const tab = TABS.find((t) => t.id === active)!;
  const { data, isLoading } = useQuery({
    queryKey: ["wc-tab", active],
    queryFn: () => listProducts({ data: tab.query }),
    staleTime: 60_000,
  });
  const live = (data?.items ?? []).map(wooToDisplay);
  const products = live.length > 0 ? live : tab.fallback();

  return (
    <section className="container-px mx-auto max-w-[1400px] py-20">
      <SectionHeader
        eyebrow="Curated selection"
        title="Featured Products"
        subtitle="Workshop favourites and editor picks across diagnostics and tuning."
        action={
          <div className="flex flex-wrap gap-1.5 rounded-full bg-secondary p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && live.length === 0
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

export function NewArrivals() {
  const { data, isLoading } = useQuery({
    queryKey: ["wc-new-arrivals"],
    queryFn: () => listProducts({ data: { orderby: "date", order: "desc", perPage: 4 } }),
    staleTime: 60_000,
  });
  const live = (data?.items ?? []).map(wooToDisplay);
  const products =
    live.length > 0 ? live : getNewArrivals(4).concat(getOnSale(4)).slice(0, 4);
  return (
    <section className="bg-secondary py-20">
      <div className="container-px mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow="Just landed"
          title="New Arrivals"
          subtitle="The latest hardware additions from our trusted manufacturers."
          action={
            <a href="#" className="text-sm font-semibold text-primary hover:underline">View all →</a>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading && live.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
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