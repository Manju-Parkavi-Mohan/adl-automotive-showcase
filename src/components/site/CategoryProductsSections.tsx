import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listCategories } from "@/lib/woo/categories.functions";
import { listProducts } from "@/lib/woo/products.functions";
import { wooToDisplay } from "@/lib/woo/adapter";
import { ProductCard } from "./ProductCard";
import type { WooCategory } from "@/lib/woo/types";
import catBgA from "@/assets/cat-bg-a.png.asset.json";
import catBgB from "@/assets/cat-bg-b.png.asset.json";

const ALT_TILE_IMAGES = [catBgA.url, catBgB.url];

export function CategoryProductsSections() {
  const { data: categories } = useQuery({
    queryKey: ["wc-categories-sections"],
    queryFn: () => listCategories({ data: { perPage: 50, parent: 0, hideEmpty: true } }),
    staleTime: 5 * 60_000,
  });

  const list = categories ?? [];
  if (list.length === 0) return null;

  return (
    <>
      {list.map((cat, idx) => (
        <CategoryProductsRow
          key={cat.id}
          category={cat}
          alt={idx % 2 === 1}
          tileImage={ALT_TILE_IMAGES[idx % ALT_TILE_IMAGES.length]}
        />
      ))}
    </>
  );
}

function CategoryProductsRow({ category, alt, tileImage }: { category: WooCategory; alt: boolean; tileImage: string }) {
  const { data: subCats } = useQuery({
    queryKey: ["wc-subcats", category.id],
    queryFn: () => listCategories({ data: { perPage: 20, parent: category.id, hideEmpty: true } }),
    staleTime: 5 * 60_000,
  });
  const tabs = useMemo(() => (subCats ?? []) as WooCategory[], [subCats]);
  // "All" tab is always present; extra tabs come from subcategories.
  const [activeTabId, setActiveTabId] = useState<number | "all">("all");
  const productCatId = activeTabId === "all" ? category.id : activeTabId;
  const { data, isLoading } = useQuery({
    queryKey: ["wc-cat-row", productCatId],
    queryFn: () => listProducts({ data: { category: String(productCatId), perPage: 12 } }),
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
          <Link to="/{-$lang}/products" search={{}} className="text-xs font-semibold text-primary">
            View all →
          </Link>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-stretch">
          {/* Category image tile — desktop only */}
          <Link
            to="/{-$lang}/products"
            search={{}}
            className="group relative hidden shrink-0 self-stretch overflow-hidden rounded-xl bg-black shadow-[var(--shadow-card)] md:block md:min-h-[460px] md:w-[280px]"
            aria-label={category.name}
          >
            <img
              src={tileImage}
              alt={category.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
            <div className="relative flex h-full flex-col items-center justify-start p-6 text-center">
              <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight text-white drop-shadow-lg">
                {category.name}
              </h2>
            </div>
          </Link>

          {/* Right column: auto-scrolling products with arrows */}
          <div className="relative min-w-0 flex-1">
            <div className="mb-4 flex h-10 items-center justify-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <TabButton active={activeTabId === "all"} onClick={() => setActiveTabId("all")}>
                All
              </TabButton>
              {tabs.map((tb) => (
                <TabButton
                  key={tb.id}
                  active={tb.id === activeTabId}
                  onClick={() => setActiveTabId(tb.id)}
                >
                  {tb.name}
                </TabButton>
              ))}
            </div>

            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => stepScroll(-1)}
              disabled={!canLeft}
              className="absolute left-1 top-[260px] z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md transition-opacity hover:bg-black hover:text-white disabled:opacity-30 sm:h-10 sm:w-10"
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
                      className="h-[400px] w-[calc((100%-20px)/2)] shrink-0 animate-pulse rounded-xl bg-card md:w-[calc((100%-40px)/3)] lg:w-[calc((100%-60px)/4)]"
                    />
                  ))
                : products.map((p) => (
                    <div
                      key={p.id}
                      data-card
                      className="h-[400px] w-[calc((100%-20px)/2)] shrink-0 snap-start md:w-[calc((100%-40px)/3)] lg:w-[calc((100%-60px)/4)]"
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
              className="absolute right-1 top-[260px] z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md transition-opacity hover:bg-black hover:text-white disabled:opacity-30 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition ${
        active
          ? "bg-black text-white shadow-md"
          : "bg-white text-black ring-1 ring-black/10 hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}
