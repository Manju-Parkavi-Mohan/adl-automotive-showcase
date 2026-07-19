import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { seoToMeta } from "@/lib/seo";

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
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-3xl py-12">
        <h1 className="text-3xl font-bold tracking-tight">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold">1. Introduction</h2>
            <p>
              These Terms &amp; Conditions govern your use of the ADL Automotive website and the purchase
              of products and services offered through it. By placing an order, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Orders &amp; Payment</h2>
            <p>
              All orders are subject to availability and confirmation of the order price. Payment is processed
              securely through our authorised payment providers. We reserve the right to cancel any order in
              case of pricing errors, fraud, or stock unavailability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Shipping &amp; Delivery</h2>
            <p>
              Shipping times and costs are provided at checkout. Delivery timeframes are estimates and not
              guaranteed. Risk of loss passes to you upon delivery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Returns &amp; Warranty</h2>
            <p>
              Products may be returned within the timeframe stated on the product page, subject to being unused
              and in original packaging. Software licences, activations, and digital downloads are non-refundable
              once delivered.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Privacy &amp; Cookies</h2>
            <p>
              We use cookies to operate the site, remember your preferences, and improve your experience.
              Personal information provided at checkout is used solely to process your order and provide support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Intellectual Property</h2>
            <p>
              All content on this website, including text, images, logos, and software, is the property of
              ADL Automotive or its licensors and is protected by applicable intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, ADL Automotive shall not be liable for any indirect,
              incidental, or consequential damages arising from the use of our products or services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Contact</h2>
            <p>
              For any questions about these terms, please contact our support team.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}