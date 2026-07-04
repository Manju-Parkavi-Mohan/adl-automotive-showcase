import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listCategories } from "@/lib/woo/categories.functions";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>}
        <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CategoryShowcase() {
  const { data, isLoading } = useQuery({
    queryKey: ["wc-categories-showcase"],
    queryFn: () => listCategories({ data: { perPage: 50, hideEmpty: true } }),
    staleTime: 5 * 60_000,
  });
  const categories = data ?? [];

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const over = scrollWidth > clientWidth + 1;
    setOverflowing(over);
    const maxScroll = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 2);
    setCanRight(scrollLeft < maxScroll - 2);
  };

  useEffect(() => {
    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [categories.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-cat-card]");
    const step = first ? first.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!isLoading && categories.length === 0) return null;

  return (
    <section aria-label="Product categories" className="bg-secondary pt-10 pb-5">
      <div className="container-px mx-auto max-w-[1400px]">
        <h2 className="mb-6 text-2xl font-extrabold uppercase tracking-tight text-black sm:text-3xl">
          Shop by Category
        </h2>
        <div className="relative">
          {/* Left arrow */}
          {overflowing && (
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md transition-opacity hover:bg-black hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div
            ref={scrollerRef}
            onScroll={update}
            className="flex snap-x snap-mandatory justify-start gap-5 overflow-x-auto scroll-smooth md:justify-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    data-cat-card
                    className="h-[110px] w-[calc((100%-20px)/2)] shrink-0 animate-pulse rounded-2xl bg-white sm:w-[260px]"
                  />
                ))
              : categories.map((c) => (
                  <Link
                    key={c.id}
                    to="/products"
                    search={{}}
                    data-cat-card
                    className="group flex h-[110px] w-[calc((100%-20px)/2)] shrink-0 snap-start items-center justify-between gap-2 rounded-2xl bg-white px-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:h-[120px] sm:w-[260px]"
                  >
                    <span className="flex-1 text-left text-[13px] font-extrabold leading-tight text-black sm:text-[15px]">
                      {c.name}
                    </span>
                    {c.image?.src && (
                      <img
                        src={c.image.src}
                        alt={c.image.alt || c.name}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
                      />
                    )}
                  </Link>
                ))}
          </div>

          {/* Right arrow */}
          {overflowing && (
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md transition-opacity hover:bg-black hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
