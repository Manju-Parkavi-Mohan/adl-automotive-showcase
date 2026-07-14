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
import {
  createPaymentOrder,
  captureOrder,
  getPayPalConfig,
} from "@/lib/paypal/paypal.functions";
import { toast } from "sonner";
import { seoToMeta } from "@/lib/seo";
import { Money } from "@/components/site/Money";
import { useLocale } from "@/i18n/LocaleProvider";

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
  const [ready, setReady] = useState(false);

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

  const missing =
    !form.first_name ||
    !form.last_name ||
    !form.email ||
    !form.address_1 ||
    !form.city ||
    !form.postcode ||
    form.country.length !== 2;

  if (items.length === 0) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("checkout.title")}</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
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
            {missing ? (
              <p className="text-xs text-muted-foreground">
                Please complete the billing details to enable payment.
              </p>
            ) : (
              <PayPalButtons
                buildOrder={() => ({
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
                })}
                onCaptured={(res) => {
                  clear();
                  navigate({
                    to: "/{-$lang}/checkout/return",
                    search: { status: "success", order_id: res.wcOrderId, order_key: "" },
                  }).catch(() => {});
                }}
                onReady={() => setReady(true)}
              />
            )}
            {!ready && !missing && (
              <p className="text-xs text-muted-foreground">Loading PayPal…</p>
            )}
          </aside>
        </div>
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

// ------------- PayPal Buttons -------------

type PayPalNamespace = {
  Buttons: (opts: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (err: unknown) => void;
  }) => { render: (el: HTMLElement) => Promise<void>; close?: () => Promise<void> };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let sdkPromise: Promise<PayPalNamespace> | null = null;
let sdkKey: string | null = null;

function loadPayPalSdk(clientId: string, currency: string): Promise<PayPalNamespace> {
  const key = `${clientId}:${currency}`;
  if (sdkPromise && sdkKey === key) return sdkPromise;
  sdkKey = key;
  sdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.paypal) return resolve(window.paypal);
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`;
    script.async = true;
    script.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal SDK failed to initialise"));
    };
    script.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

type OrderPayload = Parameters<typeof createPaymentOrder>[0] extends { data: infer D } ? D : never;

function PayPalButtons({
  buildOrder,
  onCaptured,
  onReady,
}: {
  buildOrder: () => OrderPayload;
  onCaptured: (res: { wcOrderId: number; paypalOrderId: string }) => void;
  onReady: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buildOrderRef = useRef(buildOrder);
  buildOrderRef.current = buildOrder;

  useEffect(() => {
    let cancelled = false;
    let buttons: { close?: () => Promise<void> } | null = null;

    (async () => {
      try {
        const config = await getPayPalConfig();
        if (cancelled) return;
        const paypal = await loadPayPalSdk(config.clientId, config.currency);
        if (cancelled || !containerRef.current) return;

        const b = paypal.Buttons({
          style: { layout: "vertical", shape: "rect", label: "paypal" },
          createOrder: async () => {
            setError(null);
            const res = await createPaymentOrder({ data: buildOrderRef.current() });
            return res.paypalOrderId;
          },
          onApprove: async (data) => {
            const res = await captureOrder({ data: { paypalOrderId: data.orderID } });
            if (!res.ok) {
              setError(res.error);
              toast.error(res.error);
              return;
            }
            onCaptured({ wcOrderId: res.wcOrderId, paypalOrderId: res.paypalOrderId });
          },
          onCancel: () => {
            // Keep the customer on the checkout page; do NOT mark the Woo order failed.
            toast.message("Payment cancelled. You can try again when you're ready.");
          },
          onError: (err) => {
            const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
            setError(msg);
            toast.error(msg);
          },
        });
        await b.render(containerRef.current);
        buttons = b;
        if (!cancelled) onReady();
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Could not initialise PayPal";
        setError(msg);
      }
    })();

    return () => {
      cancelled = true;
      try {
        void buttons?.close?.();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div ref={containerRef} />
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}