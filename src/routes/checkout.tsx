import { useState } from "react";
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

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Secure Checkout — ADL Automotive",
      description: "Complete your order securely with worldwide shipping and expert support.",
      url: "/checkout",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: CheckoutPage,
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

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
      toast.success(`Order #${order.number} placed`);
      clear();
      navigate({ to: "/account" }).catch(() => {});
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    },
  });

  if (items.length === 0 && !mutation.isPending && !mutation.isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-px mx-auto max-w-[1400px] py-20 text-center">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <Button asChild className="mt-6"><Link to="/products">Browse products</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-12">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"
        >
          <div className="space-y-6 rounded-xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold">Billing details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" required><Input required value={form.first_name} onChange={update("first_name")} /></Field>
              <Field label="Last name" required><Input required value={form.last_name} onChange={update("last_name")} /></Field>
              <Field label="Email" required><Input type="email" required value={form.email} onChange={update("email")} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={update("phone")} /></Field>
              <Field label="Address line 1" required className="sm:col-span-2"><Input required value={form.address_1} onChange={update("address_1")} /></Field>
              <Field label="Address line 2" className="sm:col-span-2"><Input value={form.address_2} onChange={update("address_2")} /></Field>
              <Field label="City" required><Input required value={form.city} onChange={update("city")} /></Field>
              <Field label="State / Region"><Input value={form.state} onChange={update("state")} /></Field>
              <Field label="Postal code" required><Input required value={form.postcode} onChange={update("postcode")} /></Field>
              <Field label="Country (2-letter)" required><Input required maxLength={2} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} /></Field>
            </div>
            <Field label="Order note">
              <textarea
                value={form.note}
                onChange={update("note")}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
          </div>

          <aside className="h-fit space-y-4 rounded-xl border border-border bg-secondary p-6">
            <h2 className="text-lg font-bold">Your order</h2>
            <ul className="space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-3">
                  <span className="line-clamp-2 text-foreground/80">{i.name} × {i.quantity}</span>
                  <span className="shrink-0 font-medium">{fmt(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="my-2 h-px bg-border" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Total</span><span>{fmt(subtotal)}</span></div>
            <p className="text-xs text-muted-foreground">Payment is collected manually for this demo (Cash on Delivery).</p>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Placing order…" : "Place order"}
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