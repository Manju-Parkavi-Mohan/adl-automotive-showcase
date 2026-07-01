import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/button";

function formatUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function CartDrawer() {
  const { isOpen, closeCart, items, subtotal, updateQuantity, removeItem } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
          <button aria-label="Close" onClick={closeCart} className="rounded-md p-1 hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Your cart is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">Browse our latest equipment</p>
              <Button asChild className="mt-5" onClick={closeCart}>
                <Link to="/products" search={{}}>Browse products</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    {item.brand && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.brand}
                      </p>
                    )}
                    <p className="line-clamp-2 text-sm font-medium text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">{formatUSD(item.price)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-border">
                        <button
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center hover:bg-secondary"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center hover:bg-secondary"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        aria-label="Remove item"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border bg-secondary/40 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-base font-bold text-foreground">{formatUSD(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild className="w-full" onClick={closeCart}>
                <Link to="/checkout">Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full" onClick={closeCart}>
                <Link to="/cart">View cart</Link>
              </Button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}