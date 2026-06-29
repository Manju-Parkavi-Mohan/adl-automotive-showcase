import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { SectionHeader } from "./CategoryShowcase";
import { getProductsByCategory, type ProductCategory } from "@/data/products";

export function ProductSection({
  category, title, eyebrow, subtitle,
}: { category: ProductCategory; title: string; eyebrow?: string; subtitle?: string }) {
  const all = getProductsByCategory(category);
  const brands = useMemo(() => ["All", ...Array.from(new Set(all.map((p) => p.brand)))], [all]);
  const [filter, setFilter] = useState("All");

  const items = (filter === "All" ? all : all.filter((p) => p.brand === filter)).slice(0, 4);

  return (
    <section className="container-px mx-auto max-w-[1400px] py-20">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        action={
          <a href="#" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary">
            View All
          </a>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {brands.slice(0, 6).map((b) => (
          <button
            key={b}
            onClick={() => setFilter(b)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === b
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}