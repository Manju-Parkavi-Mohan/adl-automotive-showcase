import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useLocale } from "@/i18n/LocaleProvider";

const STORAGE_KEY = "adl_cookie_consent_v1";

export function CookieBanner() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // ignore
    }
  }, []);

  if (!visible) return null;

  const dismiss = (value: "accepted" | "dismissed") => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, ts: Date.now() }));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookie.notice")}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-xl border border-border bg-white p-4 shadow-lg sm:inset-x-auto sm:end-4 sm:start-4 md:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm text-foreground">
          <p className="font-semibold">{t("cookie.title")}</p>
          <p className="mt-1 text-muted-foreground">
            {t("cookie.body")}{" "}
            <Link to="/{-$lang}/terms" className="underline underline-offset-2 hover:text-primary">
              {t("cookie.termsPrivacy")}
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => dismiss("accepted")}>{t("cookie.accept")}</Button>
            <Button size="sm" variant="outline" onClick={() => dismiss("dismissed")}>{t("cookie.dismiss")}</Button>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("cookie.close")}
          onClick={() => dismiss("dismissed")}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}