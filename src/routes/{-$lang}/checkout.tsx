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
import { CheckoutSteps } from "@/components/site/CheckoutSteps";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [termsAccepted, setTermsAccepted] = useState(false);

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
        <CheckoutSteps current="payment" />
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
            <label className="flex items-start gap-2 rounded-md border border-border bg-white p-3 text-xs text-foreground">
              <Checkbox
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(v === true)}
                className="mt-0.5"
                aria-label="Accept terms and conditions"
              />
              <span>
                I have read and agree to the{" "}
                <Link to="/{-$lang}/terms" target="_blank" className="font-medium text-primary underline underline-offset-2">
                  Terms &amp; Conditions
                </Link>
                .
              </span>
            </label>
            {missing ? (
              <p className="text-xs text-muted-foreground">
                Please complete the billing details to enable payment.
              </p>
            ) : !termsAccepted ? (
              <p className="text-xs text-muted-foreground">
                Please accept the Terms &amp; Conditions to continue with payment.
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
                total={subtotal}
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
    fundingSource?: unknown;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: (err: unknown) => void;
  }) => { render: (el: HTMLElement) => Promise<void>; close?: () => Promise<void> };
  FUNDING?: Record<string, unknown>;
  Applepay?: () => {
    config: () => Promise<{ isEligible: boolean; merchantCapabilities: string[]; supportedNetworks: string[]; countryCode: string; currencyCode: string }>;
    validateMerchant: (opts: { validationUrl: string; displayName?: string }) => Promise<unknown>;
    confirmOrder: (opts: { orderId: string; token: unknown; billingContact?: unknown; shippingContact?: unknown }) => Promise<unknown>;
  };
  Googlepay?: () => {
    config: () => Promise<{ isEligible?: boolean; allowedPaymentMethods: unknown[]; merchantInfo: unknown; apiVersion: number; apiVersionMinor: number; countryCode?: string }>;
    confirmOrder: (opts: { orderId: string; paymentMethodData: unknown }) => Promise<{ status?: string }>;
  };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
    ApplePaySession?: {
      new (version: number, req: unknown): ApplePaySessionInstance;
      canMakePayments: () => boolean;
      supportsVersion: (v: number) => boolean;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
    };
    google?: {
      payments?: {
        api?: {
          PaymentsClient: new (opts: { environment: "TEST" | "PRODUCTION" }) => {
            isReadyToPay: (req: unknown) => Promise<{ result: boolean }>;
            createButton: (opts: { onClick: () => void; buttonSizeMode?: string; buttonType?: string; buttonColor?: string }) => HTMLElement;
            loadPaymentData: (req: unknown) => Promise<unknown>;
          };
        };
      };
    };
  }
}

type ApplePaySessionInstance = {
  onvalidatemerchant: (event: { validationURL: string }) => void;
  onpaymentauthorized: (event: { payment: { token: unknown; billingContact?: unknown; shippingContact?: unknown } }) => void;
  oncancel: () => void;
  completeMerchantValidation: (session: unknown) => void;
  completePayment: (status: number) => void;
  begin: () => void;
  abort: () => void;
};

let sdkPromise: Promise<PayPalNamespace> | null = null;
let sdkKey: string | null = null;

function loadPayPalSdk(clientId: string, currency: string): Promise<PayPalNamespace> {
  const key = `${clientId}:${currency}:apm`;
  if (sdkPromise && sdkKey === key) return sdkPromise;
  sdkKey = key;
  sdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.paypal) return resolve(window.paypal);
    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": clientId,
      currency: "USD",
      intent: "capture",
      components: "buttons,applepay,googlepay",
      "enable-funding": "venmo",
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
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

let googlePaySdkPromise: Promise<void> | null = null;
function loadGooglePaySdk(): Promise<void> {
  if (googlePaySdkPromise) return googlePaySdkPromise;
  googlePaySdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.google?.payments?.api) return resolve();
    const s = document.createElement("script");
    s.src = "https://pay.google.com/gp/p/js/pay.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Pay SDK"));
    document.head.appendChild(s);
  });
  return googlePaySdkPromise;
}

let applePaySdkPromise: Promise<void> | null = null;
function loadApplePaySdk(): Promise<void> {
  if (applePaySdkPromise) return applePaySdkPromise;
  applePaySdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.ApplePaySession) return resolve();
    const s = document.createElement("script");
    s.src = "https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Apple Pay SDK"));
    document.head.appendChild(s);
  });
  return applePaySdkPromise;
}

type OrderPayload = {
  items: Array<{ product_id: number; quantity: number; variation_id?: number }>;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    email?: string;
    phone?: string;
  };
  shipping?: OrderPayload["billing"];
  customer_note?: string;
  currency?: string;
};

function PayPalButtons({
  buildOrder,
  total,
  onCaptured,
  onReady,
}: {
  buildOrder: () => OrderPayload;
  total: number;
  onCaptured: (res: { wcOrderId: number; paypalOrderId: string }) => void;
  onReady: () => void;
}) {
  const paypalRef = useRef<HTMLDivElement | null>(null);
  const applePayRef = useRef<HTMLDivElement | null>(null);
  const googlePayRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applePayEligible, setApplePayEligible] = useState(false);
  const [googlePayEligible, setGooglePayEligible] = useState(false);
  const buildOrderRef = useRef(buildOrder);
  buildOrderRef.current = buildOrder;
  const totalRef = useRef(total);
  totalRef.current = total;

  useEffect(() => {
    let cancelled = false;
    let buttons: { close?: () => Promise<void> } | null = null;

    (async () => {
      try {
        const config = await getPayPalConfig();
        if (cancelled) return;
        const paypal = await loadPayPalSdk(config.clientId, config.currency);
        if (cancelled) return;

        const createOrder = async () => {
          setError(null);
          const res = await createPaymentOrder({ data: buildOrderRef.current() });
          return res.paypalOrderId;
        };
        const doCapture = async (paypalOrderId: string) => {
          const res = await captureOrder({ data: { paypalOrderId } });
          if (!res.ok) {
            setError(res.error);
            toast.error(res.error);
            return;
          }
          onCaptured({ wcOrderId: res.wcOrderId, paypalOrderId: res.paypalOrderId });
        };
        const handleError = (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
          setError(msg);
          toast.error(msg);
        };

        // Main PayPal (renders Venmo automatically when eligible)
        if (paypalRef.current) {
          const b = paypal.Buttons({
            style: { layout: "vertical", shape: "rect", label: "paypal" },
            createOrder,
            onApprove: async (data) => doCapture(data.orderID),
            onCancel: () => toast.message("Payment cancelled. You can try again when you're ready."),
            onError: handleError,
          });
          await b.render(paypalRef.current);
          buttons = b;
        }
        if (!cancelled) onReady();

        // Apple Pay
        (async () => {
          try {
            if (!paypal.Applepay) return;
            if (typeof window === "undefined" || !window.ApplePaySession) {
              await loadApplePaySdk().catch(() => {});
            }
            if (!window.ApplePaySession || !window.ApplePaySession.canMakePayments()) return;
            const applepay = paypal.Applepay();
            const cfg = await applepay.config();
            if (cancelled || !cfg.isEligible || !applePayRef.current) return;
            setApplePayEligible(true);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.setAttribute("aria-label", "Pay with Apple Pay");
            btn.style.cssText =
              "-webkit-appearance:-apple-pay-button;-apple-pay-button-type:pay;-apple-pay-button-style:black;width:100%;height:44px;border-radius:6px;border:0;cursor:pointer;";
            btn.addEventListener("click", async () => {
              try {
                const orderId = await createOrder();
                const billing = buildOrderRef.current().billing;
                const paymentRequest = {
                  countryCode: cfg.countryCode || (billing.country || "US"),
                  currencyCode: cfg.currencyCode || config.currency,
                  merchantCapabilities: cfg.merchantCapabilities,
                  supportedNetworks: cfg.supportedNetworks,
                  requiredBillingContactFields: ["postalAddress", "name"],
                  total: { label: "ADL Automotive", amount: totalRef.current.toFixed(2) },
                };
                const Session = window.ApplePaySession!;
                const session = new Session(4, paymentRequest);
                session.onvalidatemerchant = async (event) => {
                  try {
                    const merchantSession = await applepay.validateMerchant({
                      validationUrl: event.validationURL,
                      displayName: "ADL Automotive",
                    });
                    session.completeMerchantValidation(merchantSession);
                  } catch (err) {
                    session.abort();
                    handleError(err);
                  }
                };
                session.onpaymentauthorized = async (event) => {
                  try {
                    await applepay.confirmOrder({
                      orderId,
                      token: event.payment.token,
                      billingContact: event.payment.billingContact,
                      shippingContact: event.payment.shippingContact,
                    });
                    session.completePayment(Session.STATUS_SUCCESS);
                    await doCapture(orderId);
                  } catch (err) {
                    session.completePayment(Session.STATUS_FAILURE);
                    handleError(err);
                  }
                };
                session.oncancel = () =>
                  toast.message("Payment cancelled. You can try again when you're ready.");
                session.begin();
              } catch (err) {
                handleError(err);
              }
            });
            applePayRef.current.innerHTML = "";
            applePayRef.current.appendChild(btn);
          } catch {
            // silently skip if Apple Pay init fails
          }
        })();

        // Google Pay
        (async () => {
          try {
            if (!paypal.Googlepay) return;
            await loadGooglePaySdk();
            const googlepay = paypal.Googlepay();
            const cfg = await googlepay.config();
            if (cancelled) return;
            const PaymentsClient = window.google?.payments?.api?.PaymentsClient;
            if (!PaymentsClient) return;
            const client = new PaymentsClient({
              environment: config.env === "live" ? "PRODUCTION" : "TEST",
            });
            const ready = await client.isReadyToPay({
              apiVersion: cfg.apiVersion,
              apiVersionMinor: cfg.apiVersionMinor,
              allowedPaymentMethods: cfg.allowedPaymentMethods,
            });
            if (!ready.result || !googlePayRef.current) return;
            setGooglePayEligible(true);

            const btn = client.createButton({
              buttonSizeMode: "fill",
              buttonType: "pay",
              buttonColor: "black",
              onClick: async () => {
                try {
                  const orderId = await createOrder();
                  const paymentData = await client.loadPaymentData({
                    apiVersion: cfg.apiVersion,
                    apiVersionMinor: cfg.apiVersionMinor,
                    allowedPaymentMethods: cfg.allowedPaymentMethods,
                    merchantInfo: cfg.merchantInfo,
                    transactionInfo: {
                      countryCode: cfg.countryCode || "US",
                      currencyCode: config.currency,
                      totalPriceStatus: "FINAL",
                      totalPrice: totalRef.current.toFixed(2),
                    },
                  });
                  const confirm = await googlepay.confirmOrder({
                    orderId,
                    paymentMethodData: (paymentData as { paymentMethodData: unknown }).paymentMethodData,
                  });
                  if (confirm.status && confirm.status !== "APPROVED") {
                    handleError(new Error(`Google Pay: ${confirm.status}`));
                    return;
                  }
                  await doCapture(orderId);
                } catch (err) {
                  const anyErr = err as { statusCode?: string };
                  if (anyErr && anyErr.statusCode === "CANCELED") {
                    toast.message("Payment cancelled.");
                    return;
                  }
                  handleError(err);
                }
              },
            });
            googlePayRef.current.innerHTML = "";
            googlePayRef.current.appendChild(btn);
          } catch {
            // silently skip if Google Pay init fails
          }
        })();
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
      <div ref={paypalRef} />
      <div ref={applePayRef} style={{ display: applePayEligible ? "block" : "none" }} />
      <div ref={googlePayRef} style={{ display: googlePayEligible ? "block" : "none" }} />
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}