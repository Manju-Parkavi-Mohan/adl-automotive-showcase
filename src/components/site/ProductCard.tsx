import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/site/CartProvider";
import { toast } from "sonner";
import { useLocale } from "@/i18n/LocaleProvider";
import { Money, Percent } from "@/components/site/Money";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { t } = useLocale();
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.wcId) {
      toast.error("Live product not available yet");
      return;
    }
    addItem(
      {
        productId: product.wcId,
        slug: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        brand: product.brand,
      },
      1,
    );
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]">
      <Link
        to="/{-$lang}/products/$productId"
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
            <span className="rounded-full bg-[var(--accent-blue)] px-2.5 py-0.5 text-xs font-semibold text-white">
                {t("product.new")}
            </span>
          )}
          {product.badge === "best" && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                {t("product.best")}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-white">
              <Percent value={discount} sign="-" />
            </span>
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

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
          {product.brand}
        </p>
        <Link
          to="/{-$lang}/products/$productId"
          params={{ productId: product.id }}
          className="line-clamp-2 text-xs font-semibold leading-snug text-foreground transition-colors hover:text-primary sm:text-sm"
          style={{ minHeight: "2lh" }}
        >
          {product.name}
        </Link>

        <p
          className={`text-[10px] font-semibold sm:text-xs ${
            product.inStock ? "text-emerald-600" : "text-destructive"
          }`}
        >
          {product.inStock ? t("product.inStock") : t("product.outOfStock")}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1 sm:pt-2">
          <div className="flex flex-col">
            {product.oldPrice && (
              <Money usd={product.oldPrice} strike className="text-[10px] text-muted-foreground sm:text-xs" />
            )}
            <Money usd={product.price} className="text-sm font-bold text-primary sm:text-lg" />
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            className="h-8 bg-primary px-2 text-primary-foreground hover:bg-primary/90 sm:h-9 sm:px-3"
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t("product.addToCart")}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
