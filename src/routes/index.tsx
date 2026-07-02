import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { BrandsMarquee } from "@/components/site/BrandsMarquee";
import { CategoryShowcase } from "@/components/site/CategoryShowcase";
import { FeaturedProducts, NewArrivals } from "@/components/site/FeaturedProducts";
import { CategoryProductsSections } from "@/components/site/CategoryProductsSections";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { getYoastForUrl } from "@/lib/wp/yoast.functions";
import { seoToMeta, seoToLinks, seoToScripts } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["yoast", "/"],
      queryFn: () => getYoastForUrl({ data: { path: "/" } }),
      staleTime: 5 * 60_000,
    }),
  head: ({ loaderData }) => ({
    meta: seoToMeta(loaderData ?? undefined, {
      title: "ADL Automotive — Premium Diagnostic, Tuning & Workshop Equipment",
      description:
        "Shop dealer-grade diagnostic tools, ECU programmers and tuning software from Autel, Launch, Alientech, Magic Motorsport and more. Worldwide shipping.",
      keywords:
        "automotive diagnostic tools, ECU programming, chip tuning, OBD scanners, Autel, Launch, Alientech, Magic Motorsport, workshop equipment",
      url: "/",
    }),
    links: seoToLinks(loaderData ?? undefined),
    scripts: seoToScripts(loaderData ?? undefined),
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroCarousel />
        <BrandsMarquee />
        <CategoryShowcase />
        <FeaturedProducts />
        <NewArrivals />
        <CategoryProductsSections />
        <WhyChooseUs />
      </main>
      <Footer />
    </div>
  );
}
