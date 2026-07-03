import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const products = useMemo(() => (data?.items ?? []).map(wooToDisplay), [data]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft < max - 2);
  };

  useEffect(() => {
    updateArrows();
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [products.length]);

  const stepScroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-card]");
    const step = first ? first.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

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

  if (!isLoading && products.length === 0) return null;

  return (
    <section className={`py-10 ${alt ? "bg-secondary" : ""}`} aria-label={category.name}>
      <div className="container-px mx-auto max-w-[1400px]">
        {/* Mobile-only title */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-black">{category.name}</h2>
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
            <div className="h-full w-full bg-gradient-to-br from-neutral-800 to-neutral-950" />

            <div className="absolute inset-0 flex items-center justify-center p-6">
              <h2 className="text-2xl font-extrabold leading-tight text-center text-white drop-shadow">
                {category.name}
              </h2>
            </div>
          </Link>

          {/* Right column: auto-scrolling products with arrows */}
          <div className="relative min-w-0 flex-1">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => stepScroll(-1)}
              disabled={!canLeft}
              className="absolute left-1 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md transition-opacity hover:bg-black hover:text-white disabled:opacity-30 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              ref={scrollerRef}
              onScroll={updateArrows}
              onMouseEnter={() => (pausedRef.current = true)}
              onMouseLeave={() => (pausedRef.current = false)}
              onTouchStart={() => (pausedRef.current = true)}
              onTouchEnd={() => (pausedRef.current = false)}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      data-card
                      className="h-[360px] w-[calc((100%-20px)/2)] shrink-0 animate-pulse rounded-xl bg-card md:w-[calc((100%-40px)/3)] lg:w-[calc((100%-60px)/4)]"
                    />
                  ))
                : products.map((p) => (
                    <div
                      key={p.id}
                      data-card
                      className="w-[calc((100%-20px)/2)] shrink-0 snap-start md:w-[calc((100%-40px)/3)] lg:w-[calc((100%-60px)/4)]"
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
            </div>

            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => stepScroll(1)}
              disabled={!canRight}
              className="absolute right-1 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md transition-opacity hover:bg-black hover:text-white disabled:opacity-30 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
