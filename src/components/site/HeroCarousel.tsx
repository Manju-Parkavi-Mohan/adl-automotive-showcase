import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import bannerAutodome from "@/assets/banner-adl-autodome.jpg.asset.json";
import bannerDiagnostic from "@/assets/banner-diagnostic.jpg.asset.json";
import bannerScanner from "@/assets/banner-scanner.jpg.asset.json";

const SLIDES = [
  {
    eyebrow: "Workshop Diagnostics",
    title: "Dealer-Grade Diagnostic Equipment",
    description: "Professional scan tools and key programmers trusted by independent workshops worldwide.",
    cta: "Shop Diagnostic Tools",
    image: bannerAutodome.url,
  },
  {
    eyebrow: "ECU Calibration",
    title: "Performance Tuning, Engineered.",
    description: "Bench, OBD and boot-mode programmers from Alientech, Magic Motorsport, Dimsport and more.",
    cta: "Explore Tuning Tools",
    image: bannerScanner.url,
  },
  {
    eyebrow: "Workshop Equipment",
    title: "Equip Your Bay With Confidence",
    description: "From lifts to laptops — premium hardware ready to ship from our European warehouse.",
    cta: "Browse Equipment",
    image: bannerDiagnostic.url,
  },
];

export function HeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const slide = SLIDES[i];

  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="relative h-[460px] w-full md:h-[560px]">
        {SLIDES.map((s, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
          >
            <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B2742]/85 via-[#0B2742]/55 to-transparent" />
          </div>
        ))}

        <div className="container-px relative z-10 mx-auto flex h-full max-w-[1400px] items-center">
          <div className="max-w-xl text-white">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
              {slide.eyebrow}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/85 md:text-lg">
              {slide.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-blue)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-blue)]/90">
                {slide.cta} <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                View Catalog
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