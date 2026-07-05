import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";
import adlLogo from "@/assets/adl-logo-new.png.asset.json";
import { useLocale } from "@/i18n/LocaleProvider";

export function Footer() {
  const { t } = useLocale();
  const COLS = [
    { title: t("footer.colCompany"), links: ["About ADL Automotive", "Our Story", "Careers", "Press", "Partners", "Blog"] },
    { title: t("footer.colCategories"), links: ["Diagnostic Tools", "ECU Programming", "Tuning Software", "Workshop Equipment", "Key Programmers", "OBD Adapters"] },
    { title: t("footer.colBrands"), links: ["Autel", "Launch", "Alientech", "Magic Motorsport", "Dimsport", "Xtool", "Foxwell", "Bosch"] },
    { title: t("footer.colService"), links: ["Help Center", "Shipping & Returns", "Warranty", "Technical Support", "Training & Certification", "Terms of Service"] },
  ];
  return (
    <footer className="mt-24 border-t border-border bg-[#0B2742] text-white/80">
      <div className="container-px mx-auto max-w-[1400px] py-16">
        {/* Newsletter */}
        <div className="mb-14 grid gap-8 rounded-2xl bg-white/[0.04] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h3 className="text-2xl font-bold text-white">{t("footer.newsletterTitle")}</h3>
            <p className="mt-2 text-sm text-white/70">{t("footer.newsletterCopy")}</p>
          </div>
          <form className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              type="email"
              required
              placeholder={t("footer.emailPlaceholder")}
              aria-label="Email"
              className="h-14 min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-4 text-base text-white placeholder:text-white/40 outline-none focus:border-[var(--accent-blue)] lg:w-96"
            />
            <button className="h-14 w-full shrink-0 rounded-md bg-[var(--accent-blue)] px-8 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-blue)]/90 sm:w-auto">
              {t("footer.subscribe")}
            </button>
          </form>
        </div>

        {/* Main grid */}
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,_1fr)]">
          <div>
            <div className="inline-block rounded-md bg-white p-3">
              <img src={adlLogo.url} alt="ADL Automotive" className="h-12 w-auto" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {t("footer.companyBlurb")}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-blue)]" /> Industrial Park 14, Dubai, UAE</li>
              <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-[var(--accent-blue)]" /> +971 4 000 0000</li>
              <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-[var(--accent-blue)]" /> sales@adl-automotive.com</li>
            </ul>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{col.title}</h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-white/70 transition-colors hover:text-white">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} ADL Automotive. {t("footer.rights")}</p>
          <div className="flex items-center gap-3">
            {[Facebook, Instagram, Linkedin, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 transition-colors hover:bg-[var(--accent-blue)] hover:text-white">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <span>{t("footer.weAccept")}</span>
            <span className="rounded bg-white/10 px-2 py-1 font-semibold">VISA</span>
            <span className="rounded bg-white/10 px-2 py-1 font-semibold">MC</span>
            <span className="rounded bg-white/10 px-2 py-1 font-semibold">AMEX</span>
            <span className="rounded bg-white/10 px-2 py-1 font-semibold">PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}