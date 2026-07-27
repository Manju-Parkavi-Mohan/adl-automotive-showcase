import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Package,
  MapPin,
  Clock,
  LogOut,
  User as UserIcon,
  ShoppingBag,
  DollarSign,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/site/AuthProvider";
import { logout } from "@/lib/auth/wp-auth.functions";
import { listMyOrders } from "@/lib/woo/orders.functions";
import { getMyCustomer } from "@/lib/woo/customer.functions";
import { getMyOrder } from "@/lib/woo/customer.functions";
import { listProducts } from "@/lib/woo/products.functions";
import { getRecentlyViewed, clearRecentlyViewed } from "@/lib/recently-viewed";
import { ProductCard } from "@/components/site/ProductCard";
import { wooToDisplay } from "@/lib/woo/adapter";
import { seoToMeta } from "@/lib/seo";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/{-$lang}/account/")({
  validateSearch: (search) => {
    const tabs = ["overview", "orders", "addresses", "viewed"] as const;
    const t =
      typeof search.tab === "string" && (tabs as readonly string[]).includes(search.tab)
        ? (search.tab as (typeof tabs)[number])
        : undefined;
    return t ? { tab: t } : {};
  },
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "My Account — ADL Automotive",
      description: "View your orders, addresses and recently viewed products.",
      url: "/account",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: AccountPage,
});

type TabId = "overview" | "orders" | "addresses" | "viewed";

function useTabs(t: ReturnType<typeof useT>): { id: TabId; label: string; icon: typeof Package }[] {
  return [
    { id: "overview", label: t("account.overview", "Overview"), icon: UserIcon },
    { id: "orders", label: t("account.orders", "Orders"), icon: Package },
    { id: "addresses", label: t("account.addresses", "Addresses"), icon: MapPin },
    { id: "viewed", label: t("account.recentlyViewed", "Recently Viewed"), icon: Clock },
  ];
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  "on-hold": "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-700",
  refunded: "bg-rose-100 text-rose-800",
  failed: "bg-rose-100 text-rose-800",
};

function money(value: number | string, currency = "USD") {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency });
}

function AccountPage() {
  const t = useT();
  const TABS = useTabs(t);
  const navigate = Route.useNavigate();
  const { user, isLoading, setUser } = useAuth();
  const { tab: initialTab } = Route.useSearch();
  const tab: TabId = initialTab ?? "overview";
  const setTab = (next: TabId) => {
    navigate({
      to: ".",
      search: { tab: next === "overview" ? undefined : next },
      replace: true,
    }).catch(() => {});
  };
  const ordersQuery = useQuery({
    queryKey: ["my-orders", user?.customerId],
    queryFn: () => listMyOrders(),
    enabled: !!user,
  });

  const customerQuery = useQuery({
    queryKey: ["my-customer", user?.customerId],
    queryFn: () => getMyCustomer(),
    enabled: !!user?.customerId,
  });

  const [viewedIds, setViewedIds] = useState<number[]>([]);
  useEffect(() => {
    setViewedIds(getRecentlyViewed());
  }, []);

  const viewedQuery = useQuery({
    queryKey: ["recently-viewed", viewedIds.join(",")],
    queryFn: () =>
      listProducts({
        data: { include: viewedIds, perPage: viewedIds.length, orderby: "date", order: "desc", page: 1 },
      }),
    enabled: viewedIds.length > 0,
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      setUser(null);
      navigate({ to: "/{-$lang}" }).catch(() => {});
    },
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="py-20 text-center text-sm text-muted-foreground">{t("account.loadingAccount", "Loading your account…")}</div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary">
            <UserIcon className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">{t("account.accessTitle", "Customer account access")}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("account.accessBody", "Sign in to review your orders, saved billing details, recently viewed products, and checkout preferences.")}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to="/{-$lang}/account/login">{t("common.signIn", "Sign in")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/{-$lang}/account/register">{t("common.createAccount", "Create account")}</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  const orders = ordersQuery.data ?? [];
  const customer = customerQuery.data ?? null;
  const totalSpent = customer ? Number(customer.total_spent) : orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const currency = orders[0]?.currency || "USD";

  return (
    <Shell>
      {/* Header band */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-[var(--accent-blue,theme(colors.blue.600))] p-5 text-primary-foreground sm:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 text-lg font-bold ring-2 ring-white/30 sm:h-14 sm:w-14 sm:text-xl">
              {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-white/70 sm:text-xs">{t("account.welcome", "Welcome back")}</p>
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-3xl">
                {user.displayName || user.firstName || user.email}
              </h1>
              <p className="truncate text-xs text-white/80 sm:text-sm">{user.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            size="sm"
            className="shrink-0 gap-2 sm:size-default"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{logoutMutation.isPending ? t("common.signingOut", "Signing out…") : t("common.signOut", "Sign out")}</span>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={ShoppingBag}
            label={t("account.orders", "Orders")}
            value={ordersQuery.isLoading ? "…" : String(customer?.orders_count ?? orders.length)}
          />
          <Stat icon={DollarSign} label={t("account.totalSpent", "Total spent")} value={money(totalSpent, currency)} />
          <Stat icon={Clock} label={t("account.recentlyViewed", "Recently viewed")} value={String(viewedIds.length)} />
          <Stat icon={UserIcon} label={t("account.customerId", "Customer ID")} value={user.customerId ? `#${user.customerId}` : t("account.guest", "Guest")} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 grid min-w-0 gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <nav className="grid min-w-0 grid-cols-2 gap-2 rounded-xl border border-border bg-white p-2 sm:grid-cols-4 lg:flex lg:flex-col">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition-colors sm:gap-2 sm:text-sm lg:justify-start lg:px-3 ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <t.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {tab === "overview" && (
            <OverviewPanel
              orders={orders}
              loading={ordersQuery.isLoading}
              onSeeAll={() => setTab("orders")}
              customer={customer}
            />
          )}
          {tab === "orders" && <OrdersPanel orders={orders} loading={ordersQuery.isLoading} />}
          {tab === "addresses" && (
            <AddressesPanel customer={customer} loading={customerQuery.isLoading} latestOrderId={orders[0]?.id} />
          )}
          {tab === "viewed" && (
            <ViewedPanel
              ids={viewedIds}
              items={viewedQuery.data?.items ?? []}
              loading={viewedQuery.isLoading}
              onClear={() => {
                clearRecentlyViewed();
                setViewedIds([]);
              }}
            />
          )}
        </section>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] overflow-x-hidden py-8 sm:py-10">{children}</main>
      <Footer />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-3 backdrop-blur sm:p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/70 sm:text-xs">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 truncate text-base font-bold sm:text-2xl">{value}</p>
    </div>
  );
}

function PanelCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-white p-4 sm:p-6">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const t = useT();
  const tone = STATUS_TONE[status] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
      {t(`order.status.${status}`, status.replace(/-/g, " "))}
    </span>
  );
}

function OrdersTable({ orders }: { orders: Awaited<ReturnType<typeof listMyOrders>> }) {
  const t = useT();
  return (
    <>
      <div className="space-y-3 sm:hidden">
        {orders.map((o) => (
          <Link
            key={o.id}
            to="/{-$lang}/account/orders/$orderId"
            params={{ orderId: String(o.id) }}
            className="block rounded-lg border border-border p-3 transition-colors hover:border-primary"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-primary">#{o.number}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(o.date_created).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <StatusPill status={o.status} />
                <p className="mt-2 text-sm font-semibold">{money(o.total, o.currency || "USD")}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-start text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-3 pe-4">{t("account.orderNumber", "Order")}</th>
            <th className="py-3 pe-4">{t("account.date", "Date")}</th>
            <th className="py-3 pe-4">{t("account.status", "Status")}</th>
            <th className="py-3 pe-4 text-end">{t("cart.total", "Total")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-border last:border-0">
              <td className="py-3 pe-4 font-semibold">
                <Link
                  to="/{-$lang}/account/orders/$orderId"
                  params={{ orderId: String(o.id) }}
                  className="text-primary hover:underline"
                >
                  #{o.number}
                </Link>
              </td>
              <td className="py-3 pe-4 text-muted-foreground">
                {new Date(o.date_created).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="py-3 pe-4">
                <StatusPill status={o.status} />
              </td>
              <td className="py-3 pe-4 text-end font-semibold">
                <Link
                  to="/{-$lang}/account/orders/$orderId"
                  params={{ orderId: String(o.id) }}
                  className="hover:text-primary"
                >
                  {money(o.total, o.currency || "USD")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

function OverviewPanel({
  orders,
  loading,
  onSeeAll,
  customer,
}: {
  orders: Awaited<ReturnType<typeof listMyOrders>>;
  loading: boolean;
  onSeeAll: () => void;
  customer: Awaited<ReturnType<typeof getMyCustomer>>;
}) {
  const t = useT();
  const recent = orders.slice(0, 4);
  return (
    <div className="space-y-6">
      <PanelCard
        title={t("account.recentOrders", "Recent orders")}
        action={
          orders.length > 0 ? (
            <button
              onClick={onSeeAll}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {t("common.viewAll", "View all")} <ChevronRight className="h-4 w-4" />
            </button>
          ) : null
        }
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("account.loadingOrders", "Loading orders…")}</p>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t("account.noOrders", "No orders yet")}
            body={t("account.noOrdersBody", "When you place an order it will appear here.")}
            cta={
              <Button asChild>
                <Link to="/{-$lang}/products" search={{}}>
                  {t("cart.browse", "Browse products")}
                </Link>
              </Button>
            }
          />
        ) : (
          <OrdersTable orders={recent} />
        )}
      </PanelCard>

      {customer && (
        <PanelCard title={t("account.accountDetails", "Account details")}>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Field label={t("account.name", "Name")} value={`${customer.first_name} ${customer.last_name}`.trim() || "—"} />
            <Field label={t("checkout.emailLabel", "Email")} value={customer.email} />
            <Field label={t("account.username", "Username")} value={customer.username} />
            <Field
              label={t("account.memberSince", "Member since")}
              value={
                customer.date_created
                  ? new Date(customer.date_created).toLocaleDateString(undefined, { year: "numeric", month: "long" })
                  : "—"
              }
            />
          </dl>
        </PanelCard>
      )}
    </div>
  );
}

function OrdersPanel({ orders, loading }: { orders: Awaited<ReturnType<typeof listMyOrders>>; loading: boolean }) {
  const t = useT();
  return (
    <PanelCard title={t("account.allOrders", "All orders")}>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("account.loadingOrders", "Loading orders…")}</p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("account.noOrders", "No orders yet")}
          body={t("account.noOrdersBody", "When you place an order it will appear here.")}
          cta={
            <Button asChild>
              <Link to="/{-$lang}/products" search={{}}>
                {t("cart.browse", "Browse products")}
              </Link>
            </Button>
          }
        />
      ) : (
        <OrdersTable orders={orders} />
      )}
    </PanelCard>
  );
}

function AddressesPanel({
  customer,
  loading,
  latestOrderId,
}: {
  customer: Awaited<ReturnType<typeof getMyCustomer>>;
  loading: boolean;
  latestOrderId?: number;
}) {
  const customerHasAddress = !!customer?.billing?.address_1 || !!customer?.shipping?.address_1;
  const shouldFallback = !loading && !customerHasAddress && !!latestOrderId;

  const fallbackQuery = useQuery({
    queryKey: ["order-addresses", latestOrderId],
    queryFn: () => getMyOrder({ data: { id: latestOrderId! } }),
    enabled: shouldFallback,
  });

  const t = useT();
  if (loading || (shouldFallback && fallbackQuery.isLoading)) {
    return (
      <PanelCard title={t("account.addresses", "Addresses")}>
        <p className="text-sm text-muted-foreground">{t("account.loadingGeneric", "Loading…")}</p>
      </PanelCard>
    );
  }

  const billing: AnyAddress | Record<string, string> =
    (customer?.billing?.address_1 ? customer.billing : null) ?? fallbackQuery.data?.billing ?? null;
  const shipping: AnyAddress | Record<string, string> =
    (customer?.shipping?.address_1 ? customer.shipping : null) ?? fallbackQuery.data?.shipping ?? null;

  if (!billing && !shipping) {
    return (
      <PanelCard title={t("account.addresses", "Addresses")}>
        <EmptyState
          icon={MapPin}
          title={t("account.noAddresses", "No addresses on file")}
          body={t("account.noAddressesBody", "Add a billing or shipping address during your next checkout and it will appear here.")}
        />
      </PanelCard>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <AddressCard title={t("account.billingAddress", "Billing address")} addr={billing} />
      <AddressCard title={t("account.shippingAddress", "Shipping address")} addr={shipping} />
    </div>
  );
}

type AnyAddress =
  | {
      first_name?: string;
      last_name?: string;
      company?: string;
      address_1?: string;
      address_2?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
      email?: string;
      phone?: string;
    }
  | null
  | undefined;

function AddressCard({ title, addr }: { title: string; addr: AnyAddress | Record<string, string> }) {
  const t = useT();
  const a = (addr ?? {}) as Record<string, string>;
  const empty = !a.address_1 && !a.city && !a.postcode;
  return (
    <PanelCard title={title}>
      {empty ? (
        <p className="text-sm text-muted-foreground">{t("account.noAddressOnFile", "No address on file. Add one during your next checkout.")}</p>
      ) : (
        <address className="not-italic text-sm leading-6 text-foreground">
          <p className="font-semibold">{[a.first_name, a.last_name].filter(Boolean).join(" ")}</p>
          {a.company && <p>{a.company}</p>}
          {a.address_1 && <p>{a.address_1}</p>}
          {a.address_2 && <p>{a.address_2}</p>}
          <p>{[a.postcode, a.city].filter(Boolean).join(" ")}</p>
          <p>{[a.state, a.country].filter(Boolean).join(", ")}</p>
          {a.phone && <p className="mt-2 text-muted-foreground">{a.phone}</p>}
          {a.email && <p className="text-muted-foreground">{a.email}</p>}
        </address>
      )}
    </PanelCard>
  );
}

function ViewedPanel({
  ids,
  items,
  loading,
  onClear,
}: {
  ids: number[];
  items: Awaited<ReturnType<typeof listProducts>>["items"];
  loading: boolean;
  onClear: () => void;
}) {
  const t = useT();
  if (ids.length === 0) {
    return (
      <PanelCard title={t("account.recentlyViewed", "Recently viewed")}>
        <EmptyState
          icon={Eye}
          title={t("account.nothingViewed", "Nothing here yet")}
          body={t("account.nothingViewedBody", "Products you open will show up here so you can find them again easily.")}
          cta={
            <Button asChild>
              <Link to="/{-$lang}/products" search={{}}>
                {t("cart.browse", "Browse products")}
              </Link>
            </Button>
          }
        />
      </PanelCard>
    );
  }
  // Preserve order based on ids
  const ordered = ids.map((id) => items.find((p) => p.id === id)).filter(Boolean) as typeof items;
  return (
    <PanelCard
      title={t("account.recentlyViewedCount", `Recently viewed (${ids.length})`, { count: ids.length })}
      action={
        <button onClick={onClear} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          {t("account.clearHistory", "Clear history")}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("account.loadingGeneric", "Loading…")}</p>
      ) : ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("account.noLongerAvailable", "These products are no longer available.")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ordered.map((p) => (
            <ProductCard key={p.id} product={wooToDisplay(p)} />
          ))}
        </div>
      )}
    </PanelCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: typeof Package;
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
