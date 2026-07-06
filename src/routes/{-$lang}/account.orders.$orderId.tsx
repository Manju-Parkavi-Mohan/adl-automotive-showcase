import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/site/AuthProvider";
import { getMyOrder } from "@/lib/woo/customer.functions";

export const Route = createFileRoute("/{-$lang}/account/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order details — ADL Automotive" }] }),
  component: OrderDetailPage,
});

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

function OrderDetailPage() {
  const { orderId } = useParams({ from: "/account/orders/$orderId" });
  const { user, isLoading: authLoading } = useAuth();
  const id = Number(orderId);

  const orderQuery = useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => getMyOrder({ data: { id } }),
    enabled: !!user && Number.isFinite(id),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1100px] py-10">
        <Link
          to="/{-$lang}/account"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to account
        </Link>

        {authLoading || orderQuery.isLoading ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Loading order…</p>
        ) : !user ? (
          <div className="rounded-xl border border-border bg-white p-8 text-center">
            <p className="text-sm">Please sign in to view this order.</p>
            <Button asChild className="mt-4"><Link to="/{-$lang}/account/login">Sign in</Link></Button>
          </div>
        ) : orderQuery.isError || !orderQuery.data ? (
          <div className="rounded-xl border border-border bg-white p-8 text-center">
            <h1 className="text-lg font-semibold">Order unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't load this order. It may not exist or isn't associated with your account.
            </p>
            <Button asChild variant="outline" className="mt-4"><Link to="/{-$lang}/account">Back to account</Link></Button>
          </div>
        ) : (
          <OrderView order={orderQuery.data} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function OrderView({ order }: { order: NonNullable<Awaited<ReturnType<typeof getMyOrder>>> }) {
  const currency = order.currency || "USD";
  const tone = STATUS_TONE[order.status] ?? "bg-zinc-100 text-zinc-700";
  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-blue-700 p-6 text-primary-foreground sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/70">Order</p>
            <h1 className="text-2xl font-bold sm:text-3xl">#{order.number}</h1>
            <p className="mt-1 text-sm text-white/80">
              Placed on{" "}
              {new Date(order.date_created).toLocaleDateString(undefined, {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>
              {order.status.replace(/-/g, " ")}
            </span>
            <p className="mt-2 text-2xl font-bold">{money(order.total, currency)}</p>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Items ({order.line_items.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {order.line_items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4">
              {item.image?.src ? (
                <img src={item.image.src} alt={item.name} className="h-16 w-16 rounded-md border border-border object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-md border border-border bg-secondary text-muted-foreground">
                  <Package className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  to="/{-$lang}/products/$productId"
                  params={{ productId: String(item.product_id) }}
                  className="line-clamp-2 text-sm font-semibold hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">{money(item.total, currency)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{money(order.total, currency)}</span>
            </div>
            {order.payment_method_title && (
              <p className="flex items-center justify-end gap-1.5 pt-1 text-xs text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                {order.payment_method_title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid gap-6 md:grid-cols-2">
        <AddressBlock title="Billing address" addr={order.billing} />
        <AddressBlock title="Shipping address" addr={order.shipping} />
      </div>
    </div>
  );
}

function AddressBlock({ title, addr }: { title: string; addr: Record<string, string> }) {
  const empty = !addr || (!addr.address_1 && !addr.city && !addr.postcode);
  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {empty ? (
        <p className="text-sm text-muted-foreground">No address provided.</p>
      ) : (
        <address className="not-italic text-sm leading-6 text-foreground">
          <p className="font-semibold">
            {[addr.first_name, addr.last_name].filter(Boolean).join(" ")}
          </p>
          {addr.company && <p>{addr.company}</p>}
          {addr.address_1 && <p>{addr.address_1}</p>}
          {addr.address_2 && <p>{addr.address_2}</p>}
          <p>{[addr.postcode, addr.city].filter(Boolean).join(" ")}</p>
          <p>{[addr.state, addr.country].filter(Boolean).join(", ")}</p>
          {addr.phone && <p className="mt-2 text-muted-foreground">{addr.phone}</p>}
          {addr.email && <p className="text-muted-foreground">{addr.email}</p>}
        </address>
      )}
    </div>
  );
}