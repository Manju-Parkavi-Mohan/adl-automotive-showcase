import { Truck, ShieldCheck, Lock, RotateCcw, Headphones, Zap } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";

export function WhyChooseUs() {
  const { t } = useLocale();
  const FEATURES = [
    { icon: Truck, title: t("why.shippingT"), text: t("why.shippingB") },
    { icon: ShieldCheck, title: t("why.genuineT"), text: t("why.genuineB") },
    { icon: Lock, title: t("why.secureT"), text: t("why.secureB") },
    { icon: RotateCcw, title: t("why.returnsT"), text: t("why.returnsB") },
    { icon: Headphones, title: t("why.supportT"), text: t("why.supportB") },
    { icon: Zap, title: t("why.fastT"), text: t("why.fastB") },
  ];
  return (
    <section className="bg-secondary py-20">
      <div className="container-px mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
            {t("home.whyEyebrow")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("home.whyTitle")}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {t("home.whyBody")}
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 rounded-xl bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-hover)]"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}