import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { seoToMeta } from "@/lib/seo";
import { CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";

const ORDER_STATUS_ENDPOINT =
  "https://api.adlautomotive.com/wp-json/cko/v1/order-status";

const searchSchema = z.object({
  status: z.enum(["success", "failed"]).catch("success"),
  order_id: z.coerce.number().optional(),
  order_key: z.string().optional().default(""),
});

export const Route = createFileRoute("/{-$lang}/checkout_/return")({
  validateSearch: (input) => searchSchema.parse(input),
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Payment status — ADL Automotive",
      description: "Confirming your payment.",
      url: "/checkout/return",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: CheckoutReturnPage,
});

type OrderStatus = { is_paid: boolean; status?: string; number?: string };

function CheckoutReturnPage() {
  const { status, order_id, order_key } = Route.useSearch();
  const [state, setState] = useState<
    | { kind: "polling" }
    | { kind: "confirmed"; data: OrderStatus }
    | { kind: "pending" }
    | { kind: "failed" }
  >(() => (status === "failed" ? { kind: "failed" } : { kind: "polling" }));

  useEffect(() => {
    if (status !== "success" || !order_id) return;
    let cancelled = false;
    const MAX_ATTEMPTS = 6;
    const DELAY = 1500;

    (async () => {
      for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
        if (cancelled) return;
        try {
          const url = new URL(`${ORDER_STATUS_ENDPOINT}/${order_id}`);
          if (order_key) url.searchParams.set("order_key", order_key);
          const res = await fetch(url.toString());
          if (res.ok) {
            const data = (await res.json()) as OrderStatus;
            if (data.is_paid) {
              if (!cancelled) setState({ kind: "confirmed", data });
              return;
            }
          }
        } catch {
          // ignore, keep polling
        }
        await new Promise((r) => setTimeout(r, DELAY));
      }
      if (!cancelled) setState({ kind: "pending" });
    })();

    return () => {
      cancelled = true;
    };
  }, [status, order_id, order_key]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-2xl py-20">
        <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          {state.kind === "polling" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h1 className="mt-4 text-2xl font-bold">Confirming your payment…</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This usually takes just a few seconds. Please don't close this page.
              </p>
            </>
          )}

          {state.kind === "confirmed" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <h1 className="mt-4 text-2xl font-bold">Payment confirmed</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you! Your order{state.data.number ? ` #${state.data.number}` : ""} has been received and is being processed.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild>
                  <Link to="/{-$lang}/account">View my orders</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/{-$lang}/products" search={{}}>Continue shopping</Link>
                </Button>
              </div>
            </>
          )}

          {state.kind === "pending" && (
            <>
              <Clock className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 text-2xl font-bold">We're confirming your payment</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your payment is being processed. We'll email you a confirmation as soon as it's complete.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild>
                  <Link to="/{-$lang}/account">View my orders</Link>
                </Button>
              </div>
            </>
          )}

          {state.kind === "failed" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="mt-4 text-2xl font-bold">Payment failed</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your payment couldn't be processed. Please try again.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild>
                  <Link to="/{-$lang}/checkout">Back to checkout</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
