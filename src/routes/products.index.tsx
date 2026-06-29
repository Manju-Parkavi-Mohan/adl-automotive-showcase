import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight, LayoutGrid, List, SlidersHorizontal, Star, X, ChevronDown,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductListItem } from "@/components/site/ProductListItem";
import { PRODUCTS, CATEGORY_META, type ProductCategory } from "@/data/products";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "All Products — ADL Automotive" },
      {
        name: "description",
        content:
          "Browse the full catalog of diagnostic tools, ECU programmers and tuning software from ADL Automotive.",
      },
      { property: "og:title", content: "All Products — ADL Automotive" },
      { property: "og:description", content: "Professional automotive diagnostic and tuning equipment." },
    ],
  }),
  component: ProductsPage,
});

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating", label: "Top Rated" },
  { id: "newest", label: "Newest" },
] as const;

const PRICE_RANGES = [
  { id: "0-500", label: "Under $500", min: 0, max: 500 },
  { id: "500-1500", label: "$500 – $1,500", min: 500, max: 1500 },
  { id: "1500-3000", label: "$1,500 – $3,000", min: 1500, max: 3000 },
  { id: "3000-9999", label: "Over $3,000", min: 3000, max: Infinity },
];

const PER_PAGE = 9;
const ALL_BRANDS = Array.from(new Set(PRODUCTS.map((p) => p.brand))).sort();
const ALL_CATEGORIES = Object.keys(CATEGORY_META) as ProductCategory[];

function ProductsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["id"]>("featured");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceIds, setPriceIds] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = PRODUCTS.slice();
    if (categories.length) list = list.filter((p) => categories.includes(p.category));
    if (brands.length) list = list.filter((p) => brands.includes(p.brand));
    if (priceIds.length) {
      const ranges = PRICE_RANGES.filter((r) => priceIds.includes(r.id));
      list = list.filter((p) => ranges.some((r) => p.price >= r.min && p.price <= r.max));
    }
    if (inStockOnly) list = list.filter((p) => p.inStock);
    if (onSaleOnly) list = list.filter((p) => p.oldPrice);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);

    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      case "newest":
        list.sort((a, b) => (b.badge === "new" ? 1 : 0) - (a.badge === "new" ? 1 : 0)); break;
    }
    return list;
  }, [categories, brands, priceIds, inStockOnly, onSaleOnly, minRating, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const resetAll = () => {
    setCategories([]); setBrands([]); setPriceIds([]);
    setInStockOnly(false); setOnSaleOnly(false); setMinRating(0); setPage(1);
  };

  const toggle = <T,>(value: T, list: T[], set: (v: T[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setPage(1);
  };

  const activeCount =
    categories.length + brands.length + priceIds.length +
    (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + (minRating > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page header */}
      <section className="border-b border-border bg-secondary">
        <div className="container-px mx-auto max-w-[1400px] py-10">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><a href="#" className="hover:text-primary">Shop</a></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="font-medium text-foreground">All Products</li>
            </ol>
          </nav>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">All Products</h1>
              <p className="mt-2 text-base text-muted-foreground">
                Dealer-grade diagnostic platforms, ECU programmers and calibration software trusted by
                professional workshops worldwide.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{pageItems.length}</span> of{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span> products
            </p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-[112px] z-20 border-b border-border bg-white/95 backdrop-blur lg:top-[129px]">
        <div className="container-px mx-auto flex max-w-[1400px] items-center justify-between gap-4 py-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{activeCount}</span>}
          </button>

          <div className="hidden text-sm text-muted-foreground lg:block">
            {activeCount > 0 ? (
              <button onClick={resetAll} className="font-semibold text-primary hover:underline">
                Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
              </button>
            ) : (
              "No filters applied"
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
                className="h-10 appearance-none rounded-md border border-border bg-white pl-3 pr-9 text-sm font-medium outline-none focus:border-primary"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>Sort: {o.label}</option>)}
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
              categories={categories} brands={brands} priceIds={priceIds}
              inStockOnly={inStockOnly} onSaleOnly={onSaleOnly} minRating={minRating}
              onToggleCategory={(c) => toggle(c, categories, setCategories)}
              onToggleBrand={(b) => toggle(b, brands, setBrands)}
              onTogglePrice={(p) => toggle(p, priceIds, setPriceIds)}
              setInStockOnly={(v) => { setInStockOnly(v); setPage(1); }}
              setOnSaleOnly={(v) => { setOnSaleOnly(v); setPage(1); }}
              setMinRating={(v) => { setMinRating(v); setPage(1); }}
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
                  categories={categories} brands={brands} priceIds={priceIds}
                  inStockOnly={inStockOnly} onSaleOnly={onSaleOnly} minRating={minRating}
                  onToggleCategory={(c) => toggle(c, categories, setCategories)}
                  onToggleBrand={(b) => toggle(b, brands, setBrands)}
                  onTogglePrice={(p) => toggle(p, priceIds, setPriceIds)}
                  setInStockOnly={(v) => { setInStockOnly(v); setPage(1); }}
                  setOnSaleOnly={(v) => { setOnSaleOnly(v); setPage(1); }}
                  setMinRating={(v) => { setMinRating(v); setPage(1); }}
                  onReset={resetAll}
                />
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            {pageItems.length === 0 ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-border bg-secondary py-24 text-center">
                <p className="text-base font-semibold">No products match your filters</p>
                <button onClick={resetAll} className="mt-3 text-sm font-semibold text-primary hover:underline">
                  Reset filters
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pageItems.map((p) => <ProductListItem key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination page={safePage} total={totalPages} onChange={setPage} />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function FiltersPanel(props: {
  categories: ProductCategory[]; brands: string[]; priceIds: string[];
  inStockOnly: boolean; onSaleOnly: boolean; minRating: number;
  onToggleCategory: (c: ProductCategory) => void;
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

      <FilterGroup title="Categories">
        {ALL_CATEGORIES.map((c) => (
          <Checkbox
            key={c}
            label={CATEGORY_META[c].label}
            count={PRODUCTS.filter((p) => p.category === c).length}
            checked={props.categories.includes(c)}
            onChange={() => props.onToggleCategory(c)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Brands">
        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {ALL_BRANDS.map((b) => (
            <Checkbox
              key={b}
              label={b}
              count={PRODUCTS.filter((p) => p.brand === b).length}
              checked={props.brands.includes(b)}
              onChange={() => props.onToggleBrand(b)}
            />
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
        <Checkbox label="In stock" checked={props.inStockOnly} onChange={() => props.setInStockOnly(!props.inStockOnly)} />
        <Checkbox label="On sale" checked={props.onSaleOnly} onChange={() => props.setOnSaleOnly(!props.onSaleOnly)} />
      </FilterGroup>

      <FilterGroup title="Rating">
        {[4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => props.setMinRating(props.minRating === r ? 0 : r)}
            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
              props.minRating === r ? "bg-primary/5 text-primary" : "text-foreground hover:bg-secondary"
            }`}
          >
            <span className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < r ? "fill-current" : "text-muted-foreground/30"}`} />
              ))}
              <span className="ml-1 text-xs text-foreground">& up</span>
            </span>
          </button>
        ))}
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

function Checkbox({ label, count, checked, onChange }: {
  label: string; count?: number; checked: boolean; onChange: () => void;
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