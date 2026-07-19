import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "adl_cookie_consent_v1";

export function CookieBanner() {
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
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-xl border border-border bg-white p-4 shadow-lg sm:inset-x-auto sm:end-4 sm:start-4 md:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm text-foreground">
          <p className="font-semibold">We use cookies</p>
          <p className="mt-1 text-muted-foreground">
            We use cookies to make this site work, remember your preferences, and improve your shopping experience.
            By continuing, you accept our{" "}
            <Link to="/{-$lang}/terms" className="underline underline-offset-2 hover:text-primary">
              Terms &amp; Privacy
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => dismiss("accepted")}>Accept</Button>
            <Button size="sm" variant="outline" onClick={() => dismiss("dismissed")}>Dismiss</Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close cookie notice"
          onClick={() => dismiss("dismissed")}
          className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}