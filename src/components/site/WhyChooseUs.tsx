import { Truck, ShieldCheck, Lock, RotateCcw, Headphones, Zap } from "lucide-react";

const FEATURES = [
  { icon: Truck, title: "Free Shipping", text: "On qualifying orders to 60+ countries." },
  { icon: ShieldCheck, title: "Genuine Products", text: "100% authentic, sourced direct from manufacturers." },
  { icon: Lock, title: "Secure Payments", text: "SSL-encrypted checkout with global processors." },
  { icon: RotateCcw, title: "Money Back Guarantee", text: "30-day no-questions-asked returns." },
  { icon: Headphones, title: "Technical Support", text: "Expert technicians available 6 days a week." },
  { icon: Zap, title: "Fast Delivery", text: "Express dispatch from European & UAE warehouses." },
];

export function WhyChooseUs() {
  return (
    <section className="bg-secondary py-20">
      <div className="container-px mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
            Why ADL Automotive
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            The professional standard, delivered worldwide
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            We support independent workshops, dealers and tuning specialists with vetted hardware
            and dedicated after-sales service.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 rounded-xl border border-border bg-white p-6 transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}