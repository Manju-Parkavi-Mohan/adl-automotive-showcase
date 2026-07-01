import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Package, MapPin, Clock, LogOut, User as UserIcon, ShoppingBag,
  DollarSign, ChevronRight, Eye,
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

export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "My Account — ADL Automotive" }] }),
  component: AccountPage,
});

type TabId = "overview" | "orders" | "addresses" | "viewed";

const TABS: { id: TabId; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "Overview", icon: UserIcon },
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "viewed", label: "Recently Viewed", icon: Clock },
];

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
  const { user, isLoading, setUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("overview");

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
      listProducts({ data: { include: viewedIds, perPage: viewedIds.length, orderby: "date", order: "desc", page: 1 } }),
    enabled: viewedIds.length > 0,
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      setUser(null);
      navigate({ to: "/" }).catch(() => {});
    },
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="py-20 text-center text-sm text-muted-foreground">Loading your account…</div>
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
          <h1 className="mt-5 text-2xl font-bold">Customer account access</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Sign in to review your WooCommerce orders, saved billing details, recently viewed products, and checkout preferences.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link to="/account/login">Sign in</Link></Button>
            <Button asChild variant="outline"><Link to="/account/register">Create account</Link></Button>
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
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-[var(--accent-blue,theme(colors.blue.600))] p-6 text-primary-foreground sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-xl font-bold ring-2 ring-white/30">
              {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/70">Welcome back</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {user.displayName || user.firstName || user.email}
              </h1>
              <p className="text-sm text-white/80">{user.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {logoutMutation.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={ShoppingBag} label="Orders" value={ordersQuery.isLoading ? "…" : String(customer?.orders_count ?? orders.length)} />
          <Stat icon={DollarSign} label="Total spent" value={money(totalSpent, currency)} />
          <Stat icon={Clock} label="Recently viewed" value={String(viewedIds.length)} />
          <Stat icon={UserIcon} label="Customer ID" value={user.customerId ? `#${user.customerId}` : "Guest"} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <nav className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-white p-2 lg:flex-col lg:overflow-visible">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  <span>{t.label}</span>
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
          {tab === "addresses" && <AddressesPanel customer={customer} loading={customerQuery.isLoading} />}
          {tab === "viewed" && (
            <ViewedPanel
              ids={viewedIds}
              items={viewedQuery.data?.items ?? []}
              loading={viewedQuery.isLoading}
              onClear={() => { clearRecentlyViewed(); setViewedIds([]); }}
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
      <main className="container-px mx-auto max-w-[1400px] py-10">{children}</main>
      <Footer />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p>
    </div>
  );
}

function PanelCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
      {status.replace(/-/g, " ")}
    </span>
  );
}

function OrdersTable({ orders }: { orders: Awaited<ReturnType<typeof listMyOrders>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-3 pr-4">Order</th>
            <th className="py-3 pr-4">Date</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-border last:border-0">
              <td className="py-3 pr-4 font-semibold">
                <Link
                  to="/account/orders/$orderId"
                  params={{ orderId: String(o.id) }}
                  className="text-primary hover:underline"
                >
                  #{o.number}
                </Link>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">
                {new Date(o.date_created).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </td>
              <td className="py-3 pr-4"><StatusPill status={o.status} /></td>
              <td className="py-3 pr-4 text-right font-semibold">
                <Link
                  to="/account/orders/$orderId"
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
  );
}

function OverviewPanel({
  orders, loading, onSeeAll, customer,
}: {
  orders: Awaited<ReturnType<typeof listMyOrders>>;
  loading: boolean;
  onSeeAll: () => void;
  customer: Awaited<ReturnType<typeof getMyCustomer>>;
}) {
  const recent = orders.slice(0, 4);
  return (
    <div className="space-y-6">
      <PanelCard
        title="Recent orders"
        action={
          orders.length > 0 ? (
            <button onClick={onSeeAll} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </button>
          ) : null
        }
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            body="When you place an order it will appear here."
            cta={<Button asChild><Link to="/products">Browse products</Link></Button>}
          />
        ) : (
          <OrdersTable orders={recent} />
        )}
      </PanelCard>

      {customer && (
        <PanelCard title="Account details">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Field label="Name" value={`${customer.first_name} ${customer.last_name}`.trim() || "—"} />
            <Field label="Email" value={customer.email} />
            <Field label="Username" value={customer.username} />
            <Field
              label="Member since"
              value={customer.date_created ? new Date(customer.date_created).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : "—"}
            />
          </dl>
        </PanelCard>
      )}
    </div>
  );
}

function OrdersPanel({ orders, loading }: { orders: Awaited<ReturnType<typeof listMyOrders>>; loading: boolean }) {
  return (
    <PanelCard title="All orders">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          body="When you place an order it will appear here."
          cta={<Button asChild><Link to="/products">Browse products</Link></Button>}
        />
      ) : (
        <OrdersTable orders={orders} />
      )}
    </PanelCard>
  );
}

function AddressesPanel({
  customer, loading,
}: { customer: Awaited<ReturnType<typeof getMyCustomer>>; loading: boolean }) {
  if (loading) {
    return <PanelCard title="Addresses"><p className="text-sm text-muted-foreground">Loading…</p></PanelCard>;
  }
  if (!customer) {
    return (
      <PanelCard title="Addresses">
        <EmptyState icon={MapPin} title="No customer profile" body="Address details are unavailable for this account." />
      </PanelCard>
    );
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <AddressCard title="Billing address" addr={customer.billing} />
      <AddressCard title="Shipping address" addr={customer.shipping} />
    </div>
  );
}

function AddressCard({ title, addr }: { title: string; addr: Awaited<ReturnType<typeof getMyCustomer>> extends infer T ? T extends { billing: infer A } ? A : never : never }) {
  const empty = !addr || (!addr.address_1 && !addr.city && !addr.postcode);
  return (
    <PanelCard title={title}>
      {empty ? (
        <p className="text-sm text-muted-foreground">No address on file. Add one during your next checkout.</p>
      ) : (
        <address className="not-italic text-sm leading-6 text-foreground">
          <p className="font-semibold">{addr!.first_name} {addr!.last_name}</p>
          {addr!.company && <p>{addr!.company}</p>}
          <p>{addr!.address_1}</p>
          {addr!.address_2 && <p>{addr!.address_2}</p>}
          <p>{[addr!.postcode, addr!.city].filter(Boolean).join(" ")}</p>
          <p>{[addr!.state, addr!.country].filter(Boolean).join(", ")}</p>
          {addr!.phone && <p className="mt-2 text-muted-foreground">{addr!.phone}</p>}
          {addr!.email && <p className="text-muted-foreground">{addr!.email}</p>}
        </address>
      )}
    </PanelCard>
  );
}

function ViewedPanel({
  ids, items, loading, onClear,
}: { ids: number[]; items: Awaited<ReturnType<typeof listProducts>>["items"]; loading: boolean; onClear: () => void }) {
  if (ids.length === 0) {
    return (
      <PanelCard title="Recently viewed">
        <EmptyState
          icon={Eye}
          title="Nothing here yet"
          body="Products you open will show up here so you can find them again easily."
          cta={<Button asChild><Link to="/products">Browse products</Link></Button>}
        />
      </PanelCard>
    );
  }
  // Preserve order based on ids
  const ordered = ids.map((id) => items.find((p) => p.id === id)).filter(Boolean) as typeof items;
  return (
    <PanelCard
      title={`Recently viewed (${ids.length})`}
      action={
        <button onClick={onClear} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Clear history
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground">These products are no longer available.</p>
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
  icon: Icon, title, body, cta,
}: { icon: typeof Package; title: string; body: string; cta?: React.ReactNode }) {
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