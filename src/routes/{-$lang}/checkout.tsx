import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/site/CartProvider";
import { useAuth } from "@/components/site/AuthProvider";
import { createOrder } from "@/lib/woo/orders.functions";
import { toast } from "sonner";
import { seoToMeta } from "@/lib/seo";
import { Money } from "@/components/site/Money";
import { useLocale } from "@/i18n/LocaleProvider";
import type { WooOrderSummary } from "@/lib/woo/types";

const CKO_SESSION_ENDPOINT =
  "https://api.adlautomotive.com/wp-json/cko/v1/payment-session";

export const Route = createFileRoute("/{-$lang}/checkout")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Secure Checkout — ADL Automotive",
      description: "Complete your order securely with worldwide shipping and expert support.",
      url: "/checkout",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLocale();
  const [order, setOrder] = useState<WooOrderSummary | null>(null);

  const [form, setForm] = useState({
    first_name: user?.firstName ?? "",
    last_name: user?.lastName ?? "",
    email: user?.email ?? "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "US",
    phone: "",
    note: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      createOrder({
        data: {
          items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
          billing: {
            first_name: form.first_name,
            last_name: form.last_name,
            address_1: form.address_1,
            address_2: form.address_2,
            city: form.city,
            state: form.state,
            postcode: form.postcode,
            country: form.country,
            email: form.email,
            phone: form.phone,
          },
          customer_note: form.note || undefined,
        },
      }),
    onSuccess: (order) => {
      setOrder(order);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "We couldn't start your order, please check your details and try again",
      );
    },
  });

  if (items.length === 0 && !mutation.isPending && !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-px mx-auto max-w-[1400px] py-20 text-center">
          <h1 className="text-2xl font-bold">{t("checkout.emptyCart")}</h1>
          <Button asChild className="mt-6"><Link to="/{-$lang}/products" search={{}}>{t("cart.browse")}</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-px mx-auto max-w-[1400px] py-12">
          <h1 className="text-3xl font-bold tracking-tight">{t("checkout.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order #{order.number} — complete your payment below.
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <PaymentStep
              order={order}
              onSuccess={() => {
                clear();
                navigate({
                  to: "/{-$lang}/checkout/return",
                  search: { status: "success", order_id: order.id, order_key: order.order_key ?? "" },
                }).catch(() => {});
              }}
            />
            <aside className="h-fit space-y-4 rounded-xl border border-border bg-secondary p-6">
              <h2 className="text-lg font-bold">{t("checkout.yourOrder")}</h2>
              <div className="flex justify-between text-base font-bold">
                <span>{t("cart.total")}</span>
                <Money usd={subtotal} />
              </div>
            </aside>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("checkout.title")}</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"
        >
          <div className="space-y-6 rounded-xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold">{t("checkout.billing")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("checkout.firstName")} required><Input required value={form.first_name} onChange={update("first_name")} /></Field>
              <Field label={t("checkout.lastName")} required><Input required value={form.last_name} onChange={update("last_name")} /></Field>
              <Field label={t("checkout.email")} required><Input type="email" required value={form.email} onChange={update("email")} /></Field>
              <Field label={t("checkout.phone")}><Input value={form.phone} onChange={update("phone")} /></Field>
              <Field label={t("checkout.address1")} required className="sm:col-span-2"><Input required value={form.address_1} onChange={update("address_1")} /></Field>
              <Field label={t("checkout.address2")} className="sm:col-span-2"><Input value={form.address_2} onChange={update("address_2")} /></Field>
              <Field label={t("checkout.city")} required><Input required value={form.city} onChange={update("city")} /></Field>
              <Field label={t("checkout.state")}><Input value={form.state} onChange={update("state")} /></Field>
              <Field label={t("checkout.postcode")} required><Input required value={form.postcode} onChange={update("postcode")} /></Field>
              <Field label={t("checkout.country")} required><Input required maxLength={2} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} /></Field>
            </div>
            <Field label={t("checkout.note")}>
              <textarea
                value={form.note}
                onChange={update("note")}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            {mutation.isError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                We couldn't start your order, please check your details and try again.
              </div>
            )}
          </div>

          <aside className="h-fit space-y-4 rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-bold">{t("checkout.yourOrder")}</h2>
            <ul className="space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-3">
                  <span className="line-clamp-2 text-foreground/80">{i.name} <bdi dir="ltr">× {i.quantity}</bdi></span>
                  <Money usd={i.price * i.quantity} className="shrink-0 font-medium" />
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-border" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("cart.subtotal")}</span><Money usd={subtotal} className="font-medium" /></div>
            <div className="flex justify-between text-base font-bold"><span>{t("cart.total")}</span><Money usd={subtotal} /></div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t("checkout.placing") : t("checkout.place")}
            </Button>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function PaymentStep({
  order,
  onSuccess,
}: {
  order: WooOrderSummary;
  onSuccess: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let componentInstance: { unmount?: () => void } | null = null;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(CKO_SESSION_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: order.id, order_key: order.order_key }),
        });
        if (!res.ok) throw new Error(`Failed to start payment session (${res.status})`);
        const data = (await res.json()) as {
          payment_session_token: string;
          public_key: string;
          environment: "sandbox" | "production";
          payment_session_id: string;
        };
        if (cancelled) return;

        const { loadCheckoutWebComponents } = await import(
          "@checkout.com/checkout-web-components"
        );
        if (cancelled) return;

        const checkout = await loadCheckoutWebComponents({
          publicKey: data.public_key,
          environment: data.environment,
          paymentSession: {
            id: data.payment_session_id,
            payment_session_token: data.payment_session_token,
          },
          appearance: {
            colorAction: "#0F4C81",
            colorPrimary: "#0F4C81",
            borderRadius: ["8px", "8px"] as [string, string],
          },
          onPaymentCompleted: () => {
            onSuccess();
          },
          onError: (_component, err) => {
            const msg =
              (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
                ? (err as { message: string }).message
                : "Payment failed. Please try again.");
            setError(msg);
          },
        });

        if (cancelled) return;
        const flow = checkout.create("flow");
        if (containerRef.current) {
          flow.mount(containerRef.current);
          componentInstance = flow as unknown as { unmount?: () => void };
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not initialise payment");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      try {
        componentInstance?.unmount?.();
      } catch {
        // ignore
      }
    };
  }, [order.id, order.order_key, attempt, onSuccess]);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold">Payment</h2>
      {loading && !error && (
        <p className="text-sm text-muted-foreground">Loading secure payment form…</p>
      )}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </Button>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}