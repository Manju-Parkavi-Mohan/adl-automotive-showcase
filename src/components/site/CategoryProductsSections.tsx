import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listCategories } from "@/lib/woo/categories.functions";
import { listProducts } from "@/lib/woo/products.functions";
import { wooToDisplay } from "@/lib/woo/adapter";
import { ProductCard } from "./ProductCard";
import type { WooCategory } from "@/lib/woo/types";

export function CategoryProductsSections() {
  const { data: categories } = useQuery({
    queryKey: ["wc-categories-sections"],
    queryFn: () => listCategories({ data: { perPage: 50, hideEmpty: true } }),
    staleTime: 5 * 60_000,
  });

  const list = categories ?? [];
  if (list.length === 0) return null;

  return (
    <>
      {list.map((cat, idx) => (
        <CategoryProductsRow key={cat.id} category={cat} alt={idx % 2 === 1} />
      ))}
    </>
  );
}

function CategoryProductsRow({ category, alt }: { category: WooCategory; alt: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["wc-cat-row", category.id],
    queryFn: () => listProducts({ data: { category: String(category.id), perPage: 12 } }),
    staleTime: 60_000,
  });
  const all = useMemo(() => (data?.items ?? []).map(wooToDisplay), [data]);
  const brands = useMemo(() => ["ALL", ...Array.from(new Set(all.map((p) => p.brand)))], [all]);
  const [brand, setBrand] = useState("ALL");
  const products = brand === "ALL" ? all : all.filter((p) => p.brand === brand);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  // Auto-scroll every 5s by one card width; wrap to start.
  useEffect(() => {
    if (products.length <= 1) return;
    const el = scrollerRef.current;
    if (!el) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      const first = el.querySelector<HTMLElement>("[data-card]");
      const step = first ? first.offsetWidth + 20 : el.clientWidth * 0.8;
      const maxScroll = el.scrollWidth - el.clientWidth - 2;
      if (el.scrollLeft >= maxScroll) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [products.length]);

  if (!isLoading && all.length === 0) return null;

  const image = category.image?.src;

  return (
    <section className={`py-10 ${alt ? "bg-secondary" : ""}`} aria-label={category.name}>
      <div className="container-px mx-auto max-w-[1400px]">
        {/* Mobile-only title */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">
            {category.name}
          </h2>
          <Link to="/products" search={{}} className="text-xs font-semibold text-primary">
            View all →
          </Link>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
          {/* Category image tile — desktop only */}
          <Link
            to="/products"
            search={{}}
            className="relative hidden shrink-0 overflow-hidden rounded-xl bg-black shadow-[var(--shadow-card)] md:block md:w-[280px]"
            aria-label={category.name}
          >
            {image ? (
              <img
                src={image}
                alt={category.name}
                loading="lazy"
                className="h-full w-full object-cover opacity-80"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-950" />
            )}
            <div className="absolute inset-0 flex items-start p-6">
              <h2 className="text-2xl font-extrabold leading-tight text-white drop-shadow">
                {category.name}
              </h2>
            </div>
          </Link>

          {/* Right column: brand tabs + auto-scrolling products */}
          <div className="min-w-0 flex-1">
            {brands.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {brands.slice(0, 6).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrand(b)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase transition-colors ${
                      brand === b
                        ? "bg-black text-white"
                        : "bg-card text-foreground shadow-sm hover:bg-black hover:text-white"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}

            <div
              ref={scrollerRef}
              onMouseEnter={() => (pausedRef.current = true)}
              onMouseLeave={() => (pausedRef.current = false)}
              onTouchStart={() => (pausedRef.current = true)}
              onTouchEnd={() => (pausedRef.current = false)}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      data-card
                      className="h-[360px] w-[220px] shrink-0 animate-pulse rounded-xl bg-card sm:w-[260px]"
                    />
                  ))
                : products.map((p) => (
                    <div
                      key={p.id}
                      data-card
                      className="w-[220px] shrink-0 snap-start sm:w-[260px]"
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}