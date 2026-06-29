import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { SectionHeader } from "./CategoryShowcase";
import { getBestSellers, getFeatured, getNewArrivals, getOnSale } from "@/data/products";

const TABS = [
  { id: "featured", label: "Featured", get: () => getFeatured(8) },
  { id: "popular", label: "Popular", get: () => getBestSellers(8) },
  { id: "best", label: "Best Selling", get: () => getBestSellers(8) },
  { id: "rated", label: "Top Rated", get: () => getFeatured(8) },
] as const;

export function FeaturedProducts() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("featured");
  const products = TABS.find((t) => t.id === active)!.get();

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
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

export function NewArrivals() {
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
          {getNewArrivals(4).concat(getOnSale(4)).slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}