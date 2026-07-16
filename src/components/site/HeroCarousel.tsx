import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import bannerCustom1 from "@/assets/banner_engine_dance.jpg";
import bannerCustom2 from "@/assets/banner_flex.jpg";
import bannerCustom3 from "@/assets/banner_flex_open.jpg";
import { useLocale } from "@/i18n/LocaleProvider";

const SLIDE_IMAGES = [bannerCustom1, bannerCustom2, bannerCustom3];

export function HeroCarousel() {
  const { t } = useLocale();
  const SLIDES = [
    {
      eyebrow: t("hero.s1e"),
      title: t("hero.s1t"),
      description: t("hero.s1d"),
      cta: t("hero.s1c"),
      image: SLIDE_IMAGES[0],
    },
    {
      eyebrow: t("hero.s2e"),
      title: t("hero.s2t"),
      description: t("hero.s2d"),
      cta: t("hero.s2c"),
      image: SLIDE_IMAGES[1],
    },
    {
      eyebrow: t("hero.s3e"),
      title: t("hero.s3t"),
      description: t("hero.s3d"),
      cta: t("hero.s3c"),
      image: SLIDE_IMAGES[2],
    },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [SLIDES.length]);
  const slide = SLIDES[i];

  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="relative h-[460px] w-full md:h-[560px]">
        {SLIDES.map((s, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
          >
            <img
              src={s.image}
              alt={s.title}
              className="h-full w-full object-cover object-[80%_center] md:object-center"
            />
            {/* Mobile: full dark scrim so text is always legible over any part of the photo */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/50 to-black/60 md:hidden" />
            {/* Desktop: original side gradient, image has room on the right for the product */}
            <div className="absolute inset-0 hidden md:block bg-[linear-gradient(to_right,rgba(11,39,66,0.85)_0%,rgba(11,39,66,0.5)_30%,transparent_55%)]" />
          </div>
        ))}

        <div className="container-px relative z-10 mx-auto flex h-full max-w-[1400px] items-center">
          <div className="max-w-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
              {slide.eyebrow}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">{slide.title}</h1>
            <p className="mt-5 text-base leading-relaxed text-white/90 md:text-lg">{slide.description}</p>
            ...
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-blue)]/90">
                {slide.cta} <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                {t("hero.viewCatalog")}
              </button>
            </div>
          </div>
        </div>

        {/* Arrows */}
        <button
          aria-label="Previous"
          onClick={() => setI((v) => (v - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          aria-label="Next"
          onClick={() => setI((v) => (v + 1) % SLIDES.length)}
          className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-4 bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
