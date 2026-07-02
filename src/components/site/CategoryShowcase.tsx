import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listCategories } from "@/lib/woo/categories.functions";

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
        <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CategoryShowcase() {
  const { data, isLoading } = useQuery({
    queryKey: ["wc-categories-showcase"],
    queryFn: () => listCategories({ data: { perPage: 50, hideEmpty: true } }),
    staleTime: 5 * 60_000,
  });
  const categories = data ?? [];
  if (!isLoading && categories.length === 0) return null;

  return (
    <section aria-label="Product categories" className="bg-background py-10">
      <div className="container-px mx-auto max-w-[1400px]">
        <div
          className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 w-40 shrink-0 animate-pulse rounded-xl bg-card shadow-[var(--shadow-card)]"
                />
              ))
            : categories.map((c) => (
                <Link
                  key={c.id}
                  to="/products"
                  search={{}}
                  className="inline-flex h-14 shrink-0 items-center whitespace-nowrap rounded-xl bg-card px-6 text-sm font-bold text-black shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:text-primary hover:shadow-[var(--shadow-hover)]"
                >
                  {c.name}
                </Link>
              ))}
        </div>
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