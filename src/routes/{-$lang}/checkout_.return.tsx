import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { seoToMeta } from "@/lib/seo";
import { CheckCircle2, XCircle } from "lucide-react";
import { CheckoutSteps } from "@/components/site/CheckoutSteps";

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

function CheckoutReturnPage() {
  const { status, order_id } = Route.useSearch();
  const success = status === "success";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-2xl py-12">
        <CheckoutSteps current={success ? "complete" : "payment"} />
        <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          {success ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <h1 className="mt-4 text-2xl font-bold">Payment confirmed</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you! Your order{order_id ? ` #${order_id}` : ""} has been
                received and is being processed.
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
          ) : (
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
