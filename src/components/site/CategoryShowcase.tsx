import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
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
        {eyebrow && (
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
        )}
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
  const [scrollPct, setScrollPct] = useState(0); // 0-1 thumb position
  const [thumbWidth, setThumbWidth] = useState(1); // 0-1 thumb width
  const [showIndicator, setShowIndicator] = useState(false);

  const updateIndicator = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflowing = scrollWidth > clientWidth + 1;
    setShowIndicator(overflowing);
    if (!overflowing) return;
    const maxScroll = scrollWidth - clientWidth;
    setScrollPct(maxScroll > 0 ? scrollLeft / maxScroll : 0);
    setThumbWidth(clientWidth / scrollWidth);
  };

  if (!isLoading && categories.length === 0) return null;

  return (
    <section aria-label="Product categories" className="bg-[#ececec] py-10">
      <div className="container-px mx-auto max-w-[1400px]">
        {/* Scroller */}
        <div
          ref={scrollerRef}
          onScroll={updateIndicator}
          className="flex gap-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[150px] w-[210px] shrink-0 animate-pulse rounded-2xl bg-white" />
              ))
            : categories.map((c) => (
                <Link
                  key={c.id}
                  to="/products"
                  search={{}}
                  className="group flex h-[150px] w-[210px] shrink-0 items-center justify-between gap-3 rounded-2xl bg-white px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-[15px] font-extrabold leading-tight text-black">{c.name}</span>
                  {c.image?.src && (
                    <img src={c.image.src} alt={c.name} className="h-16 w-16 shrink-0 object-contain" loading="lazy" />
                  )}
                </Link>
              ))}
        </div>

        {/* Horizontal scroll indicator — thin, no extra vertical footprint */}
        {showIndicator && (
          <div className="relative mt-3 h-1 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="absolute top-0 h-full rounded-full bg-black/60 transition-[left] duration-75"
              style={{
                width: `${Math.max(thumbWidth * 100, 8)}%`,
                left: `${scrollPct * (100 - Math.max(thumbWidth * 100, 8))}%`,
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
