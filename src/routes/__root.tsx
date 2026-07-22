import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportAppError } from "../lib/error-reporting";
import { CartProvider } from "@/components/site/CartProvider";
import { CartDrawer } from "@/components/site/CartDrawer";
import { AuthProvider } from "@/components/site/AuthProvider";
import { CookieBanner } from "@/components/site/CookieBanner";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { detectI18n } from "@/i18n/detect.functions";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  LOCALE_META,
  isLocale,
  type Locale,
} from "@/i18n/config";
import { buildLocaleLinks, ogUrlFor, SITE_URL } from "@/i18n/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/{-$lang}"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      return await detectI18n();
    } catch {
      return {
        locale: DEFAULT_LOCALE,
        currency: DEFAULT_CURRENCY,
        country: null,
        localeSource: "default" as const,
        path: "/",
        urlLocale: null,
      };
    }
  },
  head: ({ loaderData }) => {
    const locale: Locale = isLocale(loaderData?.locale) ? loaderData.locale : DEFAULT_LOCALE;
    const cleanPath = loaderData?.path ?? "/";
    return ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "referrer", content: "no-referrer" },
      { title: "ADL Automotive — Premium Diagnostic, Tuning & Workshop Equipment" },
      { name: "description", content: "Shop premium automotive diagnostic tools, ECU programmers, tuning software and workshop equipment. Trusted by professional technicians worldwide." },
      { name: "author", content: "ADL Automotive" },
      { property: "og:locale", content: locale === "ar" ? "ar_AE" : "en_US" },
      { property: "og:locale:alternate", content: locale === "ar" ? "en_US" : "ar_AE" },
      { property: "og:title", content: "ADL Automotive — Premium Diagnostic, Tuning & Workshop Equipment" },
      { property: "og:description", content: "Shop premium automotive diagnostic tools, ECU programmers, tuning software and workshop equipment. Trusted by professional technicians worldwide." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ADL Automotive" },
      { property: "og:url", content: ogUrlFor(cleanPath, locale) },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@ADLAutomotive" },
      { name: "twitter:title", content: "ADL Automotive — Premium Diagnostic, Tuning & Workshop Equipment" },
      { name: "twitter:description", content: "Shop premium automotive diagnostic tools, ECU programmers, tuning software and workshop equipment. Trusted by professional technicians worldwide." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/DWqou8l0sAVgdwTkVh0aK3gheDi2/social-images/social-1782955924162-C63A1113-5327-44F9-A307-FAE86BC94669.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/DWqou8l0sAVgdwTkVh0aK3gheDi2/social-images/social-1782955924162-C63A1113-5327-44F9-A307-FAE86BC94669.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      // Per-page hreflang + canonical. buildLocaleLinks produces one canonical
      // and one alternate per supported locale plus x-default. Because links
      // concatenate across matches, we deliberately keep them ONLY at the root
      // so every page has exactly one canonical.
      ...buildLocaleLinks(cleanPath, locale),
    ],
    });
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { loaderData } = Route.useMatch();
  const rawLocale = (loaderData as { locale?: unknown } | undefined)?.locale;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dir = LOCALE_META[locale].dir;
  return (
    <html lang={locale} dir={dir}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const data = Route.useLoaderData();
  const locale = data?.locale ?? DEFAULT_LOCALE;
  const currency = data?.currency ?? DEFAULT_CURRENCY;

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider locale={locale} currency={currency} country={data?.country ?? null}>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <CartDrawer />
            <CookieBanner />
            <Toaster richColors position="top-right" />
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}
