import { BRANDS } from "@/data/products";

export function BrandsMarquee() {
  const items = [...BRANDS, ...BRANDS];
  return (
    <section aria-label="Trusted brands" className="bg-[#0B2742] py-12">
      <div className="container-px mx-auto max-w-[1400px]">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white">
          Trusted by leading automotive brands
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex w-max gap-6">
            {items.map((b, i) => (
              <div
                key={i}
                className="grid h-16 min-w-[160px] place-items-center rounded-lg border border-white/10 bg-white/[0.06] px-8 text-base font-bold tracking-wide text-white shadow-[var(--shadow-card)] backdrop-blur-sm"
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
