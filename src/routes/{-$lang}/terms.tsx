import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { seoToMeta } from "@/lib/seo";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/{-$lang}/terms")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Terms & Conditions — ADL Automotive",
      description: "Read the terms and conditions for purchasing from ADL Automotive.",
      url: "/terms",
    }),
  }),
  component: TermsPage,
});

function TermsPage() {
  const t = useT();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-3xl py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("terms.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("terms.lastUpdated", "Last updated: {year}").replace("{year}", String(new Date().getFullYear()))}
        </p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold">{t("terms.s1Title")}</h2>
            <p>{t("terms.s1Body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t("terms.s2Title")}</h2>
            <p>{t("terms.s2Body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t("terms.s3Title")}</h2>
            <p>{t("terms.s3Body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t("terms.s4Title")}</h2>
            <p>{t("terms.s4Body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t("terms.s5Title")}</h2>
            <p>{t("terms.s5Body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t("terms.s6Title")}</h2>
            <p>{t("terms.s6Body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t("terms.s7Title")}</h2>
            <p>{t("terms.s7Body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">{t("terms.s8Title")}</h2>
            <p>{t("terms.s8Body")}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}