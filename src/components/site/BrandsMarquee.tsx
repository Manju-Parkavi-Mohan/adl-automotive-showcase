import { useQuery } from "@tanstack/react-query";
import { BRANDS } from "@/data/products";
import { useLocale } from "@/i18n/LocaleProvider";
import { listBrands } from "@/lib/woo/brands.functions";

export function BrandsMarquee() {
  const { t } = useLocale();
  const { data } = useQuery({
    queryKey: ["wc-brands"],
    queryFn: async () => (await listBrands()) ?? [],
    staleTime: 10 * 60_000,
    retry: false,
  });
  const brandNames = (data && data.length > 0 ? data.map((b) => b.name) : BRANDS) as string[];
  const items = [...brandNames, ...brandNames];
  return (
    <section aria-label="Trusted brands" className="bg-[#0B2742] py-12">
      <div className="container-px mx-auto max-w-[1400px]">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white">
          {t("home.trustedBrands")}
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
