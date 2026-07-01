import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "@/components/site/CartProvider";
import { Button } from "@/components/ui/button";
import { seoToMeta } from "@/lib/seo";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Your Cart — ADL Automotive",
      description: "Review the diagnostic and tuning equipment in your cart before checkout.",
      keywords: "shopping cart, ADL Automotive cart, checkout",
      url: "/cart",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: CartPage,
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clear } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-12">
        <h1 className="text-3xl font-bold tracking-tight">Your Cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</p>

        {items.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-xl border border-dashed border-border bg-secondary py-24 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">Your cart is empty</p>
            <Button asChild className="mt-5"><Link to="/products">Browse products</Link></Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-border rounded-xl border border-border bg-white">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 p-4">
                  <Link to="/products/$productId" params={{ productId: item.slug }} className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    {item.brand && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.brand}</p>
                    )}
                    <Link to="/products/$productId" params={{ productId: item.slug }} className="line-clamp-2 text-sm font-semibold hover:text-primary">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-primary">{fmt(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-border">
                        <button aria-label="Decrease" className="grid h-8 w-8 place-items-center hover:bg-secondary" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button aria-label="Increase" className="grid h-8 w-8 place-items-center hover:bg-secondary" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{fmt(item.price * item.quantity)}</span>
                        <button aria-label="Remove" onClick={() => removeItem(item.productId)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-xl border border-border bg-secondary p-6">
              <h2 className="text-lg font-bold">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">{fmt(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>Calculated at checkout</dd></div>
              </dl>
              <div className="my-4 h-px bg-border" />
              <div className="flex justify-between text-base font-bold"><span>Total</span><span>{fmt(subtotal)}</span></div>
              <Button asChild className="mt-5 w-full"><Link to="/checkout">Checkout</Link></Button>
              <Button variant="outline" className="mt-2 w-full" onClick={clear}>Empty cart</Button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}