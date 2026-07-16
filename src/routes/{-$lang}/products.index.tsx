import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronRight, LayoutGrid, List, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductListItem } from "@/components/site/ProductListItem";
import { listProducts } from "@/lib/woo/products.functions";
import { listCategories } from "@/lib/woo/categories.functions";
import { wooToDisplay } from "@/lib/woo/adapter";
import { getYoastForUrl } from "@/lib/wp/yoast.functions";
import { seoToMeta, seoToLinks, seoToScripts } from "@/lib/seo";

export const Route = createFileRoute("/{-$lang}/products/")({
  validateSearch: (search) =>
    typeof search.search === "string" && search.search.trim() ? { search: search.search } : {},
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["yoast", "/shop"],
      queryFn: () => getYoastForUrl({ data: { path: "/shop" } }),
      staleTime: 5 * 60_000,
    }),
  head: ({ loaderData }) => ({
    meta: seoToMeta(loaderData ?? undefined, {
      title: "All Products — ADL Automotive",
      description:
        "Browse the full catalog of diagnostic tools, ECU programmers and tuning software from ADL Automotive.",
      keywords:
        "automotive diagnostic tools, OBD-II scanners, ECU programmers, key programming, tuning software, workshop equipment",
      url: "/products",
    }),
    links: seoToLinks(loaderData ?? undefined),
    scripts: seoToScripts(loaderData ?? undefined),
  }),
  component: ProductsPage,
});

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "newest", label: "Newest" },
] as const;

const PRICE_RANGES = [
  { id: "0-500", label: "Under $500", min: 0, max: 500 },
  { id: "500-1500", label: "$500 – $1,500", min: 500, max: 1500 },
  { id: "1500-3000", label: "$1,500 – $3,000", min: 1500, max: 3000 },
  { id: "3000-9999", label: "Over $3,000", min: 3000, max: 999999 },
];

const PER_PAGE = 12;

function sortToWoo(id: (typeof SORT_OPTIONS)[number]["id"]) {
  switch (id) {
    case "price-asc":
      return { orderby: "price" as const, order: "asc" as const };
    case "price-desc":
      return { orderby: "price" as const, order: "desc" as const };
    case "newest":
      return { orderby: "date" as const, order: "desc" as const };
    case "featured":
    default:
      return { orderby: "popularity" as const, order: "desc" as const };
  }
}

function ProductsPage() {
  const { search: searchParam } = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["id"]>("featured");
  const [page, setPage] = useState(1);
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceIds, setPriceIds] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const wooSort = sortToWoo(sort);
  const priceRange = useMemo(() => {
    if (!priceIds.length)
      return { minPrice: undefined as number | undefined, maxPrice: undefined as number | undefined };
    const selected = PRICE_RANGES.filter((r) => priceIds.includes(r.id));
    if (!selected.length) return { minPrice: undefined, maxPrice: undefined };
    return {
      minPrice: Math.min(...selected.map((r) => r.min)),
      maxPrice: Math.max(...selected.map((r) => r.max)),
    };
  }, [priceIds]);

  const categoriesQuery = useQuery({
    queryKey: ["wc-categories"],
    queryFn: () => listCategories({ data: { perPage: 50, hideEmpty: true } }),
    staleTime: 5 * 60_000,
  });

  const productsQuery = useQuery({
    queryKey: ["wc-products", { page, sort, categorySlugs, priceIds, onSaleOnly, search: searchParam }],
    queryFn: () =>
      listProducts({
        data: {
          page,
          perPage: PER_PAGE,
          orderby: wooSort.orderby,
          order: wooSort.order,
          search: searchParam,
          category: categorySlugs.length ? categorySlugs.join(",") : undefined,
          minPrice: priceRange.minPrice,
          maxPrice: priceRange.maxPrice === 999999 ? undefined : priceRange.maxPrice,
          onSale: onSaleOnly || undefined,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const rawItems = productsQuery.data?.items ?? [];
  const display = rawItems.map(wooToDisplay);

  // Client-side fine filters (brand / inStock / minRating) over fetched page
  const pageItems = display.filter((p) => {
    if (brands.length && !brands.includes(p.brand)) return false;
    if (inStockOnly && !p.inStock) return false;
    return true;
  });

  const totalCount = productsQuery.data?.total ?? 0;
  const totalPages = productsQuery.data?.totalPages ?? 1;
  const safePage = page;

  const allBrands = Array.from(new Set(display.map((p) => p.brand))).sort();
  const allCategories = (categoriesQuery.data ?? []).filter((c) => c.parent === 0);

  const clearSearch = () => {
    navigate({ search: (prev: { search?: string }) => ({ ...prev, search: undefined }) });
  };

  const resetAll = () => {
    setCategorySlugs([]);
    setBrands([]);
    setPriceIds([]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setMinRating(0);
    setPage(1);
    clearSearch();
  };

  const toggle = <T,>(value: T, list: T[], set: (v: T[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setPage(1);
  };

  const activeCount =
    categorySlugs.length +
    brands.length +
    priceIds.length +
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (searchParam ? 1 : 0);

  const isSearching = Boolean(searchParam);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page header */}
      <section className="border-b border-border bg-secondary">
        <div className="container-px mx-auto max-w-[1400px] py-10">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link to="/{-$lang}" className="hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link to="/{-$lang}/products" search={{}} className="hover:text-primary">
                  Shop
                </Link>
              </li>
              {isSearching && (
                <>
                  <li>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li className="font-medium text-foreground">Search</li>
                </>
              )}
            </ol>
          </nav>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {isSearching ? `Search: "${searchParam}"` : "All Products"}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {isSearching
                  ? `Showing results for "${searchParam}" across our catalog.`
                  : "Dealer-grade diagnostic platforms, ECU programmers and calibration software trusted by professional workshops worldwide."}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{pageItems.length}</span> of{" "}
              <span className="font-semibold text-foreground">{totalCount}</span> products
            </p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-[100px] z-20 border-b border-border bg-white/95 backdrop-blur sm:top-[108px] lg:top-[160px]">
        <div className="container-px mx-auto flex max-w-[1400px] items-center justify-between gap-4 py-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters{" "}
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>

          <div className="hidden flex-wrap items-center gap-2 text-sm text-muted-foreground lg:flex">
            {isSearching && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Search: {searchParam}
                <button onClick={clearSearch} aria-label="Clear search" className="hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {activeCount > 0 ? (
              <button onClick={resetAll} className="font-semibold text-primary hover:underline">
                Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
              </button>
            ) : (
              "No filters applied"
            )}
          </div>

          <div className="ms-auto flex items-center gap-3">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as typeof sort);
                  setPage(1);
                }}
                className="h-10 appearance-none rounded-md border border-border bg-white ps-3 pe-9 text-sm font-medium outline-none focus:border-primary"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    Sort: {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="hidden items-center gap-1 rounded-md border border-border p-1 sm:flex">
              <button
                aria-label="Grid view"
                onClick={() => setView("grid")}
                className={`grid h-8 w-8 place-items-center rounded ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                aria-label="List view"
                onClick={() => setView("list")}
                className={`grid h-8 w-8 place-items-center rounded ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container-px mx-auto max-w-[1400px] py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <FiltersPanel
              searchParam={searchParam}
              onClearSearch={clearSearch}
              categorySlugs={categorySlugs}
              brands={brands}
              priceIds={priceIds}
              allCategories={allCategories.map((c) => ({ value: String(c.id), label: c.name, count: c.count }))}
              allBrands={allBrands}
              inStockOnly={inStockOnly}
              onSaleOnly={onSaleOnly}
              minRating={minRating}
              onToggleCategory={(c) => toggle(c, categorySlugs, setCategorySlugs)}
              onToggleBrand={(b) => toggle(b, brands, setBrands)}
              onTogglePrice={(p) => toggle(p, priceIds, setPriceIds)}
              setInStockOnly={(v) => {
                setInStockOnly(v);
                setPage(1);
              }}
              setOnSaleOnly={(v) => {
                setOnSaleOnly(v);
                setPage(1);
              }}
              setMinRating={(v) => {
                setMinRating(v);
                setPage(1);
              }}
              onReset={resetAll}
            />
          </aside>

          {/* Mobile drawer */}
          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-[88vw] max-w-sm overflow-y-auto bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Filters</h2>
                  <button aria-label="Close" onClick={() => setFiltersOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <FiltersPanel
                  searchParam={searchParam}
                  onClearSearch={clearSearch}
                  categorySlugs={categorySlugs}
                  brands={brands}
                  priceIds={priceIds}
                  allCategories={allCategories.map((c) => ({ value: String(c.id), label: c.name, count: c.count }))}
                  allBrands={allBrands}
                  inStockOnly={inStockOnly}
                  onSaleOnly={onSaleOnly}
                  minRating={minRating}
                  onToggleCategory={(c) => toggle(c, categorySlugs, setCategorySlugs)}
                  onToggleBrand={(b) => toggle(b, brands, setBrands)}
                  onTogglePrice={(p) => toggle(p, priceIds, setPriceIds)}
                  setInStockOnly={(v) => {
                    setInStockOnly(v);
                    setPage(1);
                  }}
                  setOnSaleOnly={(v) => {
                    setOnSaleOnly(v);
                    setPage(1);
                  }}
                  setMinRating={(v) => {
                    setMinRating(v);
                    setPage(1);
                  }}
                  onReset={resetAll}
                />
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            {productsQuery.isLoading ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-border bg-secondary py-24 text-center">
                <p className="text-sm text-muted-foreground">Loading products…</p>
              </div>
            ) : productsQuery.isError ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 py-16 text-center">
                <p className="text-sm font-semibold text-destructive">Couldn&apos;t load products.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {productsQuery.error instanceof Error ? productsQuery.error.message : "Unknown error"}
                </p>
              </div>
            ) : pageItems.length === 0 ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-border bg-secondary py-24 text-center">
                <p className="text-base font-semibold">
                  {isSearching ? `No products found for "${searchParam}"` : "No products match your filters"}
                </p>
                <button onClick={resetAll} className="mt-3 text-sm font-semibold text-primary hover:underline">
                  {isSearching ? "Clear search & filters" : "Reset filters"}
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {pageItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pageItems.map((p) => (
                  <ProductListItem key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && <Pagination page={safePage} total={totalPages} onChange={setPage} />}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function FiltersPanel(props: {
  searchParam?: string;
  onClearSearch: () => void;
  categorySlugs: string[];
  brands: string[];
  priceIds: string[];
  allCategories: Array<{ value: string; label: string; count: number }>;
  allBrands: string[];
  inStockOnly: boolean;
  onSaleOnly: boolean;
  minRating: number;
  onToggleCategory: (slug: string) => void;
  onToggleBrand: (b: string) => void;
  onTogglePrice: (id: string) => void;
  setInStockOnly: (v: boolean) => void;
  setOnSaleOnly: (v: boolean) => void;
  setMinRating: (v: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Filters</h2>
        <button onClick={props.onReset} className="text-xs font-semibold text-primary hover:underline">
          Reset all
        </button>
      </div>

      {props.searchParam && (
        <div className="rounded-lg bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search</p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{props.searchParam}</span>
            <button onClick={props.onClearSearch} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <FilterGroup title="Categories">
        {props.allCategories.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">Loading…</p>
        ) : (
          props.allCategories.map((c) => (
            <Checkbox
              key={c.value}
              label={c.label}
              count={c.count}
              checked={props.categorySlugs.includes(c.value)}
              onChange={() => props.onToggleCategory(c.value)}
            />
          ))
        )}
      </FilterGroup>

      <FilterGroup title="Brands">
        <div className="max-h-56 space-y-1 overflow-y-auto pe-1">
          {props.allBrands.length === 0 && <p className="px-2 text-xs text-muted-foreground">No brands on this page</p>}
          {props.allBrands.map((b) => (
            <Checkbox key={b} label={b} checked={props.brands.includes(b)} onChange={() => props.onToggleBrand(b)} />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price Range">
        {PRICE_RANGES.map((r) => (
          <Checkbox
            key={r.id}
            label={r.label}
            checked={props.priceIds.includes(r.id)}
            onChange={() => props.onTogglePrice(r.id)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        <Checkbox
          label="In stock"
          checked={props.inStockOnly}
          onChange={() => props.setInStockOnly(!props.inStockOnly)}
        />
        <Checkbox label="On sale" checked={props.onSaleOnly} onChange={() => props.setOnSaleOnly(!props.onSaleOnly)} />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-5 last:border-0 last:pb-0">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Checkbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary">
      <span className="flex items-center gap-2.5">
        <span
          className={`grid h-4 w-4 place-items-center rounded border transition-colors ${
            checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white"
          }`}
        >
          {checked && (
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <span className="text-foreground">{label}</span>
      </span>
      {count != null && <span className="text-xs text-muted-foreground">({count})</span>}
    </label>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="h-10 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`grid h-10 w-10 place-items-center rounded-md text-sm font-semibold transition-colors ${
            p === page
              ? "bg-primary text-primary-foreground"
              : "border border-border text-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page === total}
        onClick={() => onChange(page + 1)}
        className="h-10 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
