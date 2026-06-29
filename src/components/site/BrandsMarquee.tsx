import { BRANDS } from "@/data/products";

export function BrandsMarquee() {
  const items = [...BRANDS, ...BRANDS];
  return (
    <section aria-label="Trusted brands" className="border-y border-border bg-white py-10">
      <div className="container-px mx-auto max-w-[1400px]">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Trusted by leading automotive brands
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex w-max gap-12">
            {items.map((b, i) => (
              <div
                key={i}
                className="grid h-14 min-w-[140px] place-items-center rounded-md border border-border bg-secondary px-6 text-sm font-bold tracking-wide text-foreground/70"
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}