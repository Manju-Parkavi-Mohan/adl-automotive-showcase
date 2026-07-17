import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";
import { listProducts } from "@/lib/woo/products.functions";
import { wooToDisplay } from "@/lib/woo/adapter";
import { useWishlist } from "@/hooks/use-wishlist";
import { seoToMeta } from "@/lib/seo";

export const Route = createFileRoute("/{-$lang}/account/wishlist")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Wishlist — ADL Automotive",
      description: "Products you've saved for later.",
      url: "/account/wishlist",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids, clear } = useWishlist();

  const query = useQuery({
    queryKey: ["wishlist-products", ids.join(",")],
    queryFn: () =>
      listProducts({
        data: { include: ids, perPage: Math.max(ids.length, 1), page: 1, orderby: "date", order: "desc" },
      }),
    enabled: ids.length > 0,
  });

  const items = query.data?.items ?? [];
  // Preserve the order the user added them (latest first).
  const ordered = ids.map((id) => items.find((p) => p.id === id)).filter(Boolean) as typeof items;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Wishlist</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {ids.length === 0
                ? "You haven't saved any products yet."
                : `${ids.length} product${ids.length > 1 ? "s" : ""} saved for later.`}
            </p>
          </div>
          {ids.length > 0 && (
            <Button variant="outline" onClick={clear} className="gap-2">
              <Trash2 className="h-4 w-4" /> Clear all
            </Button>
          )}
        </div>

        {ids.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-xl border border-border bg-white px-6 py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">Nothing here yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Tap the heart icon on any product to save it here for later.
            </p>
            <Button asChild className="mt-5">
              <Link to="/{-$lang}/products" search={{}}>Browse products</Link>
            </Button>
          </div>
        ) : query.isLoading ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Loading wishlist…</p>
        ) : ordered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary p-10 text-center text-sm text-muted-foreground">
            Saved products are no longer available.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {ordered.map((p) => (
              <ProductCard key={p.id} product={wooToDisplay(p)} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}