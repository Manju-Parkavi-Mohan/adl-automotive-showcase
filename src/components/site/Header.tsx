import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/components/site/CartProvider";
import { useAuth } from "@/components/site/AuthProvider";
import { useWishlist } from "@/hooks/use-wishlist";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Globe,
  ChevronDown,
  Menu,
  X,
  Tag,
  Download,
  Wrench,
  KeyRound,
} from "lucide-react";
import adlLogo from "@/assets/adl-logo-new.png.asset.json";
import { listCategories } from "@/lib/woo/categories.functions";
import { useLocale } from "@/i18n/LocaleProvider";
import {
  LOCALE_META,
  SUPPORTED_LOCALES,
  SUPPORTED_CURRENCIES,
  CURRENCY_META,
  type Locale,
  type Currency,
} from "@/i18n/config";

const NAV_LINKS = [
  { key: "home", to: "/{-$lang}" as const },
  { key: "products", to: "/{-$lang}/products" as const },
  { key: "blog", to: "/{-$lang}/blog" as const },
  { key: "about", to: "/{-$lang}" as const },
  { key: "contact", to: "/{-$lang}" as const },
];

const EXTRA_LINKS = [
  { key: "downloads", icon: Download },
  { key: "softwareServices", icon: Wrench },
  { key: "onlineTokens", icon: KeyRound },
];

export function Header() {
  const [catOpen, setCatOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<number | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [curOpen, setCurOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { count, openCart } = useCart();
  const { user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { t, locale, currency, setLocale, setCurrency } = useLocale();
  const { data: wcCategories } = useQuery({
    queryKey: ["wc-categories-nav"],
    queryFn: () => listCategories({ data: { perPage: 50, hideEmpty: true } }),
    staleTime: 5 * 60_000,
  });
  const allCategories = wcCategories ?? [];
  const topCategories = allCategories.filter((c) => !c.parent);
  const subsByParent = allCategories.reduce<Record<number, typeof allCategories>>((acc, c) => {
    if (c.parent) {
      (acc[c.parent] ||= []).push(c);
    }
    return acc;
  }, {});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate({ to: "/{-$lang}/products", search: { search: searchQuery.trim() } });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      {/* Top utility bar */}
      <div className="hidden sm:block border-b border-border bg-primary text-primary-foreground">
        <div className="container-px mx-auto flex h-9 max-w-[1400px] items-center justify-between text-xs">
          <p>{t("topbar.tagline")}</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white/80">
              {t("topbar.support")}
            </a>
            <a href="#" className="hover:text-white/80">
              {t("topbar.trackOrder")}
            </a>
            <a href="#" className="hover:text-white/80">
              {t("topbar.b2b")}
            </a>
          </div>
        </div>
      </div>

      {/* Top header */}
      <div className="container-px mx-auto max-w-[1400px]">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 py-1 sm:gap-6 sm:py-2 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
          {/* Mobile menu trigger — left */}
          <button
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-md border border-border lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Logo — centered on mobile, left on desktop */}
          <Link
            to="/{-$lang}"
            aria-label="ADL Automotive — home"
            className="flex shrink-0 items-center justify-center lg:justify-start"
          >
            <img src={adlLogo.url} alt="ADL Automotive" className="h-14 w-auto sm:h-16 md:h-20" />
          </Link>

          {/* Search */}
          <div className="hidden min-w-0 lg:block">
            <form onSubmit={handleSearch} className="relative mx-auto max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("common.searchPlaceholder")}
                aria-label={t("common.search")}
                className="h-11 w-full rounded-full border border-border bg-secondary ps-11 pe-28 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 h-8 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("common.search")}
              </button>
            </form>
          </div>

          {/* Mobile login — top right */}
          <Link
            to={user ? "/{-$lang}/account" : "/{-$lang}/account/login"}
            aria-label={user ? t("common.account") : t("common.login")}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary hover:text-primary lg:hidden"
          >
            <User className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">
              {user?.firstName || (user ? t("common.account") : t("common.login"))}
            </span>
          </Link>

          {/* Account icons — desktop only (mobile uses fixed bottom nav) */}
          <div className="hidden shrink-0 items-center gap-1 sm:gap-3 lg:flex">
            <div className="relative">
              <button
                onClick={() => {
                  setLangOpen((v) => !v);
                  setCurOpen(false);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground transition-colors hover:text-primary"
                aria-haspopup="true"
                aria-expanded={langOpen}
              >
                <Globe className="h-4 w-4" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-md border border-border bg-white shadow-lg">
                  {SUPPORTED_LOCALES.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLangOpen(false);
                        setLocale(l as Locale);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-secondary ${l === locale ? "font-semibold text-primary" : "text-foreground"}`}
                    >
                      <span>{LOCALE_META[l as Locale].nativeLabel}</span>
                      <span className="text-xs uppercase text-muted-foreground">{l}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setCurOpen((v) => !v);
                  setLangOpen(false);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                aria-haspopup="true"
                aria-expanded={curOpen}
              >
                <span>{CURRENCY_META[currency].label}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {curOpen && (
                <div className="absolute right-0 top-full z-40 mt-1 w-32 overflow-hidden rounded-md border border-border bg-white shadow-lg">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCurOpen(false);
                        setCurrency(c as Currency);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-secondary ${c === currency ? "font-semibold text-primary" : "text-foreground"}`}
                    >
                      <span>{CURRENCY_META[c as Currency].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/{-$lang}/account/wishlist"
              aria-label={t("common.wishlist")}
              className="relative grid h-9 w-9 place-items-center rounded-md text-foreground transition-colors hover:text-primary sm:h-10 sm:w-10"
            >
              <Heart className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent-blue)] px-1 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
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
              to={user ? "/{-$lang}/account" : "/{-$lang}/account/login"}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              <User className="h-4 w-4" />
              <span>{user?.firstName || user?.displayName || t("common.login")}</span>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-2 lg:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              className="h-9 w-full rounded-full border border-border bg-secondary ps-9 pe-3 text-sm outline-none focus:border-primary focus:bg-white"
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
              <span>{t("common.allCategories")}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {catOpen && (
              <div
                onMouseLeave={() => setCatOpen(false)}
                className="absolute left-0 top-full z-40 mt-1 flex rounded-lg border border-border bg-white shadow-[var(--shadow-card)]"
              >
                <div className="max-h-96 w-72 overflow-y-auto">
                  {topCategories.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">{t("common.loading")}</div>
                  ) : (
                    topCategories.map((c) => {
                      const subs = subsByParent[c.id] ?? [];
                      const hasSubs = subs.length > 0;
                      return (
                        <div
                          key={c.id}
                          onMouseEnter={() => setHoveredCat(c.id)}
                          className="border-b border-border last:border-0"
                        >
                          <Link
                            to="/{-$lang}/products"
                            search={{ category: String(c.id) }}
                            onClick={() => setCatOpen(false)}
                            className={`flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary ${hoveredCat === c.id ? "bg-secondary text-primary" : ""}`}
                          >
                            <span className="flex items-center gap-3">
                              <Tag className="h-4 w-4 text-primary" />
                              {c.name}
                            </span>
                            {hasSubs && <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />}
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
                {hoveredCat !== null && (subsByParent[hoveredCat]?.length ?? 0) > 0 && (
                  <div className="max-h-96 w-72 overflow-y-auto border-s border-border bg-white">
                    {(subsByParent[hoveredCat] ?? []).map((s) => (
                      <Link
                        key={s.id}
                        to="/{-$lang}/products"
                        search={{ category: String(s.id) }}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center gap-3 border-b border-border px-4 py-3 text-sm text-foreground transition-colors last:border-0 hover:bg-secondary hover:text-primary"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((n) => (
              <Link
                key={n.key}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:text-primary"
              >
                {t(`nav.${n.key}`)}
              </Link>
            ))}
          </nav>

          <div className="ms-auto hidden items-center gap-1 lg:flex">
            {EXTRA_LINKS.map((p) => (
              <a
                key={p.key}
                href="#"
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                <p.icon className="h-4 w-4" />
                {t(`nav.${p.key}`)}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold uppercase tracking-wide text-primary">{t("common.menu")}</span>
              <button aria-label={t("common.close")} onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex flex-col">
              {NAV_LINKS.map((n) => (
                <Link
                  key={n.key}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-border px-1 py-2.5 text-sm font-bold uppercase tracking-wide text-black hover:text-primary"
                >
                  {t(`nav.${n.key}`)}
                </Link>
              ))}
              {EXTRA_LINKS.map((p) => (
                <a
                  key={p.key}
                  href="#"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 border-b border-border px-1 py-2.5 text-sm font-bold uppercase tracking-wide text-black hover:text-primary"
                >
                  {t(`nav.${p.key}`)}
                </a>
              ))}
              {/* Language + currency in mobile drawer */}
              <p className="mt-5 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("common.language")}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 px-1">
                {SUPPORTED_LOCALES.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l as Locale)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${l === locale ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}
                  >
                    {LOCALE_META[l as Locale].nativeLabel}
                  </button>
                ))}
              </div>
              <p className="mt-4 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("common.currency")}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 px-1">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c as Currency)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${c === currency ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}
                  >
                    {CURRENCY_META[c as Currency].label}
                  </button>
                ))}
              </div>
              <p className="mt-5 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("common.categories")}
              </p>
              {topCategories.map((c) => {
                const subs = subsByParent[c.id] ?? [];
                const hasSubs = subs.length > 0;
                const expanded = mobileExpandedCat === c.id;
                return (
                  <div key={c.id} className="border-b border-border">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to="/{-$lang}/products"
                        search={{ category: String(c.id) }}
                        onClick={() => setMobileOpen(false)}
                        className="flex flex-1 items-center gap-2 px-1 py-2 text-xs font-semibold uppercase tracking-wide text-black hover:text-primary"
                      >
                        <Tag className="h-3.5 w-3.5 text-primary" /> {c.name}
                      </Link>
                      {hasSubs && (
                        <button
                          aria-label={expanded ? "Collapse" : "Expand"}
                          onClick={() => setMobileExpandedCat(expanded ? null : c.id)}
                          className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-primary"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                    {hasSubs && expanded && (
                      <div className="mb-1 flex flex-col ps-6">
                        {subs.map((s) => (
                          <Link
                            key={s.id}
                            to="/{-$lang}/products"
                            search={{ category: String(s.id) }}
                            onClick={() => setMobileOpen(false)}
                            className="border-t border-border px-1 py-2 text-xs font-medium text-foreground hover:text-primary"
                          >
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile fixed bottom nav */}
      <nav
        aria-label="Mobile quick actions"
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-border bg-white shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)] lg:hidden"
      >
        <Link
          to="/{-$lang}/account/wishlist"
          aria-label={t("common.wishlist")}
          className="relative flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold text-foreground hover:text-primary"
        >
          <span className="relative">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent-blue)] px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </span>
          <span>{t("common.wishlist")}</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold text-foreground hover:text-primary"
          aria-label={t("common.language")}
        >
          <Globe className="h-5 w-5" />
          <span>{locale.toUpperCase()}</span>
        </button>
        <Link
          to={user ? "/{-$lang}/account" : "/{-$lang}/account/login"}
          className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold text-foreground hover:text-primary"
        >
          <User className="h-5 w-5" />
          <span>{user ? t("common.account") : t("common.login")}</span>
        </Link>
        <button
          onClick={openCart}
          aria-label={t("common.cart")}
          className="relative flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold text-foreground hover:text-primary"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>{t("common.cart")}</span>
          {count > 0 && (
            <span className="absolute right-4 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent-blue)] px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </nav>
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
    <button
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-md text-foreground transition-colors hover:text-primary"
    >
      <Icon className="h-5 w-5" />
      {count != null && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent-blue)] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
