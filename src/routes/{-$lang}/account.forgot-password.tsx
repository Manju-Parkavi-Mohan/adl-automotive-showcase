import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requestPasswordReset } from "@/lib/auth/wp-auth.functions";
import { CheckCircle2 } from "lucide-react";
import { seoToMeta } from "@/lib/seo";
import { useLocale } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/{-$lang}/account/forgot-password")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Reset password — ADL Automotive",
      description: "Request a password reset link for your ADL Automotive account.",
      keywords: "ADL Automotive password reset, forgot password",
      url: "/account/forgot-password",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const schema = z.object({
    email: z.string().trim().min(1, "Please enter your email address.").email("Please enter a valid email address."),
  });

  const mutation = useMutation({
    mutationFn: () => requestPasswordReset({ data: { email } }),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto flex max-w-md flex-col py-16">
        <h1 className="text-3xl font-bold tracking-tight">{t("auth.resetPasswordTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.resetPasswordSubtitle")}
        </p>

        {mutation.isSuccess ? (
          <Alert className="mt-8">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>{t("auth.checkInboxTitle")}</AlertTitle>
            <AlertDescription>
              {t("auth.checkInboxBody", { email })}
            </AlertDescription>
          </Alert>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = schema.safeParse({ email });
              if (!parsed.success) {
                setError(parsed.error.issues[0]?.message ?? "Invalid email");
                return;
              }
              setError(null);
              mutation.mutate();
            }}
            className="mt-8 space-y-4 rounded-xl border border-border bg-white p-6"
          >
            <div>
              <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-invalid={!!error}
              />
              {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t("auth.sending") : t("auth.sendResetLink")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.rememberedIt")}{" "}
              <Link to="/{-$lang}/account/login" className="font-semibold text-primary hover:underline">
                {t("auth.backToSignIn")}
              </Link>
            </p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}