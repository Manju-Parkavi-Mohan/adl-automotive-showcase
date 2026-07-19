import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "@/components/site/CartProvider";
import { Button } from "@/components/ui/button";
import { seoToMeta } from "@/lib/seo";
import { Money, Num } from "@/components/site/Money";
import { useLocale } from "@/i18n/LocaleProvider";
import { CheckoutSteps } from "@/components/site/CheckoutSteps";

export const Route = createFileRoute("/{-$lang}/cart")({
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

function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clear } = useCart();
  const { t } = useLocale();
  const itemWord = items.length === 1 ? t("cart.item_one") : t("cart.item_other");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-12">
        <CheckoutSteps current="cart" />
        <h1 className="text-3xl font-bold tracking-tight">{t("cart.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground"><Num>{items.length}</Num> {itemWord}</p>

        {items.length === 0 ? (
          <div className="mt-10 grid place-items-center rounded-xl border border-dashed border-border bg-secondary py-24 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">{t("cart.empty")}</p>
            <Button asChild className="mt-5"><Link to="/{-$lang}/products" search={{}}>{t("cart.browse")}</Link></Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-border rounded-xl border border-border bg-white">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 p-4">
                  <Link to="/{-$lang}/products/$productId" params={{ productId: item.slug }} className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    {item.brand && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.brand}</p>
                    )}
                    <Link to="/{-$lang}/products/$productId" params={{ productId: item.slug }} className="line-clamp-2 text-sm font-semibold hover:text-primary">
                      {item.name}
                    </Link>
                    <Money usd={item.price} className="mt-1 text-sm font-bold text-primary" />
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-border">
                        <button aria-label={t("product.decrease")} className="grid h-8 w-8 place-items-center hover:bg-secondary" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium"><Num>{item.quantity}</Num></span>
                        <button aria-label={t("product.increase")} className="grid h-8 w-8 place-items-center hover:bg-secondary" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Money usd={item.price * item.quantity} className="text-sm font-semibold" />
                        <button aria-label={t("cart.remove")} onClick={() => removeItem(item.productId)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-xl border border-border bg-secondary p-6">
              <h2 className="text-lg font-bold">{t("cart.summary")}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("cart.subtotal")}</dt><dd className="font-medium"><Money usd={subtotal} /></dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("cart.shipping")}</dt><dd>{t("cart.shippingCalc")}</dd></div>
              </dl>
              <div className="my-4 h-px bg-border" />
              <div className="flex justify-between text-base font-bold"><span>{t("cart.total")}</span><Money usd={subtotal} /></div>
              <Button asChild className="mt-5 w-full"><Link to="/{-$lang}/checkout">{t("cart.checkout")}</Link></Button>
              <Button variant="outline" className="mt-2 w-full" onClick={clear}>{t("cart.empty_bin")}</Button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}