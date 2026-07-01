import { ArrowRight } from "lucide-react";

const CATEGORIES = [
  {
    title: "Diagnostic Tools",
    description: "OBD scanners, key programmers, dealer-grade tablets.",
    count: "120+ products",
    image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Tuning Tools",
    description: "Bench, OBD and boot-mode ECU programmers.",
    count: "60+ products",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Workshop Equipment",
    description: "Lifts, scopes, power supplies and bay essentials.",
    count: "200+ products",
    image: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=80",
  },
];

export function CategoryShowcase() {
  return (
    <section className="container-px mx-auto max-w-[1400px] py-20">
      <SectionHeader
        eyebrow="Browse by category"
        title="Shop by Category"
        subtitle="Curated equipment for diagnostics, performance tuning and full workshop set-up."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {CATEGORIES.map((c) => (
          <a
            key={c.title}
            href="#"
            className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-secondary"
          >
            <img
              src={c.image}
              alt={c.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B2742]/95 via-[#0B2742]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
                {c.count}
              </p>
              <h3 className="mt-2 text-2xl font-bold">{c.title}</h3>
              <p className="mt-2 text-sm text-white/80">{c.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition-transform group-hover:translate-x-1">
                Explore <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow, title, subtitle, action,
}: { eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}