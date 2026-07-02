import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/components/site/CartProvider";
import { useAuth } from "@/components/site/AuthProvider";
import {
  Search, Heart, ShoppingCart, User, Globe, ChevronDown, Menu, X,
  Sparkles, Flame, Award, Tag,
} from "lucide-react";
import adlLogo from "@/assets/adl-logo-new.png.asset.json";
import { listCategories } from "@/lib/woo/categories.functions";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Blog", to: "/blog" },
  { label: "About Us", to: "/" },
  { label: "Contact", to: "/" },
];

const PROMO_TABS = [
  { label: "New Products", icon: Sparkles },
  { label: "Super Deals", icon: Flame },
  { label: "Best Sellers", icon: Award },
];

export function Header() {
  const [catOpen, setCatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { count, openCart } = useCart();
  const { user } = useAuth();
  const { data: wcCategories } = useQuery({
    queryKey: ["wc-categories-nav"],
    queryFn: () => listCategories({ data: { perPage: 50, hideEmpty: true } }),
    staleTime: 5 * 60_000,
  });
  const categories = wcCategories ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate({ to: "/products", search: { search: searchQuery.trim() } });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      {/* Top utility bar */}
      <div className="hidden sm:block border-b border-border bg-primary text-primary-foreground">
        <div className="container-px mx-auto flex h-9 max-w-[1400px] items-center justify-between text-xs">
          <p>Premium automotive diagnostic & tuning equipment — shipped worldwide</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white/80">Support</a>
            <a href="#" className="hover:text-white/80">Track Order</a>
            <a href="#" className="hover:text-white/80">B2B Inquiry</a>
          </div>
        </div>
      </div>

      {/* Top header */}
      <div className="container-px mx-auto max-w-[1400px]">
        <div className="grid grid-cols-[auto_auto] items-center justify-between gap-3 py-2 sm:gap-6 sm:py-4 md:grid-cols-[auto_1fr_auto] md:justify-start lg:gap-10">
          {/* Logo */}
          <Link to="/" aria-label="ADL Automotive — home" className="flex shrink-0 items-center">
            <img src={adlLogo.url} alt="ADL Automotive" className="h-10 w-auto md:h-14" />
          </Link>

          {/* Search */}
          <div className="hidden min-w-0 md:block">
            <form onSubmit={handleSearch} className="relative mx-auto max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diagnostic tools, ECU programmers, brands..."
                aria-label="Search products"
                className="h-11 w-full rounded-full border border-border bg-secondary pl-11 pr-28 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 h-8 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Search
              </button>
            </form>
          </div>

          {/* Account icons */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <button className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary lg:flex">
              <Globe className="h-4 w-4" />
              <span>EN</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <button className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary lg:flex">
              <span>USD $</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <IconButton label="Wishlist" icon={Heart} />
            <button
              aria-label="Open cart"
              onClick={openCart}
              className="relative grid h-9 w-9 place-items-center rounded-md text-foreground transition-colors hover:text-primary sm:h-10 sm:w-10"
            >
              <ShoppingCart className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent-blue)] px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
            <Link
              to={user ? "/account" : "/account/login"}
              className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary sm:flex"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">
                {user?.firstName || user?.displayName || "Login"}
              </span>
            </Link>
            <button
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-md border border-border lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-2 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="h-9 w-full rounded-full border border-border bg-secondary pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-white"
            />
          </form>
        </div>
      </div>

      {/* Main navigation — desktop only */}
      <div className="hidden border-t border-border bg-white lg:block">
        <div className="container-px mx-auto flex h-14 max-w-[1400px] items-center gap-6">
          {/* Category dropdown */}
          <div className="relative">
            <button
              onClick={() => setCatOpen((v) => !v)}
              onMouseEnter={() => setCatOpen(true)}
              className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Menu className="h-4 w-4" />
              <span>All Categories</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {catOpen && (
              <div
                onMouseLeave={() => setCatOpen(false)}
                className="absolute left-0 top-full z-40 mt-1 max-h-96 w-72 overflow-y-auto rounded-lg border border-border bg-white shadow-[var(--shadow-card)]"
              >
                {categories.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Loading…</div>
                ) : (
                  categories.map((c) => (
                    <Link
                      key={c.id}
                      to="/products"
                      search={{}}
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm font-medium text-foreground transition-colors last:border-0 hover:bg-secondary hover:text-primary"
                    >
                      <Tag className="h-4 w-4 text-primary" />
                      {c.name}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-1 lg:flex">
            {PROMO_TABS.map((p) => (
              <a
                key={p.label}
                href="#"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                <p.icon className="h-3.5 w-3.5" />
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">Menu</span>
              <button aria-label="Close" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">
              {NAV_LINKS.map((n) => (
                <a key={n.label} href="#" className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  {n.label}
                </a>
              ))}
              <div className="my-4 h-px bg-border" />
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</p>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/products"
                  search={{}}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-secondary"
                >
                  <Tag className="h-4 w-4 text-primary" /> {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function IconButton({
  icon: Icon,
  count,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  label: string;
}) {
  return (
    <button aria-label={label} className="relative grid h-10 w-10 place-items-center rounded-md text-foreground transition-colors hover:text-primary">
      <Icon className="h-5 w-5" />
      {count != null && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent-blue)] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}