import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Product } from "@/data/products";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]">
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="relative block aspect-square overflow-hidden bg-secondary"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.badge === "new" && (
            <span className="rounded-full bg-[var(--accent-blue)] px-2.5 py-0.5 text-xs font-semibold text-white">NEW</span>
          )}
          {product.badge === "best" && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">BEST</span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-white">-{discount}%</span>
          )}
        </div>
        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            aria-label="Add to wishlist"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-foreground shadow-sm transition-colors hover:bg-white hover:text-primary"
          >
            <Heart className="h-4 w-4" />
          </button>
          <button
            aria-label="Quick view"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-foreground shadow-sm transition-colors hover:bg-white hover:text-primary"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</p>
        <Link
          to="/products/$productId"
          params={{ productId: product.id }}
          className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? "fill-current" : ""}`} />
            ))}
          </div>
          <span>({product.reviewCount})</span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-xs text-muted-foreground line-through">${product.oldPrice.toLocaleString()}</span>
            )}
            <span className="text-lg font-bold text-primary">${product.price.toLocaleString()}</span>
          </div>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>
    </article>
  );
}