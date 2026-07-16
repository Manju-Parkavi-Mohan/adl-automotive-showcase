import { Heart, ShoppingCart, Eye, Check } from "lucide-react";
import type { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/site/CartProvider";
import { toast } from "sonner";
import { useLocale } from "@/i18n/LocaleProvider";
import { Money, Percent, Num } from "@/components/site/Money";

export function ProductListItem({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { t } = useLocale();
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleAdd = () => {
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
    <article className="group grid grid-cols-1 gap-6 overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-[var(--shadow-card)] sm:grid-cols-[220px_1fr_auto]">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge === "new" && (
          <span className="absolute start-3 top-3 rounded-full bg-[var(--accent-blue)] px-2.5 py-0.5 text-xs font-semibold text-white">
            {t("product.new")}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute start-3 top-3 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-white">
            <Percent value={discount} sign="-" />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {product.brand} · {product.categoryLabel}
        </p>
        <h3 className="text-lg font-semibold leading-snug text-foreground">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-foreground/70">
            {t("product.sku")}: <Num>{product.sku}</Num>
          </span>
          {product.inStock && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
              <Check className="h-3 w-3" /> {t("product.inStock")}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-row items-end justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
        <div className="text-end">
          {product.oldPrice && (
            <Money usd={product.oldPrice} strike className="block text-xs text-muted-foreground" />
          )}
          <Money usd={product.price} className="block text-2xl font-bold text-primary" />
        </div>
        <div className="flex flex-col gap-2 sm:w-44">
          <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <ShoppingCart className="h-4 w-4" /> {t("product.addToCart")}
          </Button>
          <div className="flex gap-2">
            <button className="grid h-9 flex-1 place-items-center rounded-md border border-border transition-colors hover:border-primary hover:text-primary" aria-label={t("product.quickView")}>
              <Eye className="h-4 w-4" />
            </button>
            <button className="grid h-9 flex-1 place-items-center rounded-md border border-border transition-colors hover:border-primary hover:text-primary" aria-label={t("common.wishlist")}>
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}