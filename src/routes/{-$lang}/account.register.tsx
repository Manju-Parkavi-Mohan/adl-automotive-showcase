import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { register } from "@/lib/auth/wp-auth.functions";
import { useAuth } from "@/components/site/AuthProvider";
import { toast } from "sonner";
import { seoToMeta } from "@/lib/seo";

export const Route = createFileRoute("/{-$lang}/account/register")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Create account — ADL Automotive",
      description: "Create an ADL Automotive account for faster checkout and order tracking.",
      keywords: "ADL Automotive register, create account",
      url: "/account/register",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const schema = z.object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    email: z.string().trim().min(1, "Email is required.").email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Password must contain a letter.")
      .regex(/[0-9]/, "Password must contain a number."),
  });

  const mutation = useMutation({
    mutationFn: () => register({ data: form }),
    onSuccess: async (data) => {
      setUser({
        email: data.email,
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        customerId: data.customerId,
      });
      toast.success("Account created");
      navigate({ to: "/{-$lang}/account" }).catch(() => {});
    },
    onError: () => { /* shown inline below */ },
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const errorMsg = mutation.error instanceof Error ? mutation.error.message : null;
  const emailExists = errorMsg?.toLowerCase().includes("already exists");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto flex max-w-md flex-col py-16">
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Join ADL Automotive to track orders and check out faster.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = schema.safeParse(form);
            if (!parsed.success) {
              const errs: Partial<Record<keyof typeof form, string>> = {};
              for (const issue of parsed.error.issues) {
                const k = issue.path[0] as keyof typeof form;
                if (!errs[k]) errs[k] = issue.message;
              }
              setErrors(errs);
              return;
            }
            setErrors({});
            mutation.mutate();
          }}
          className="mt-8 space-y-4 rounded-xl border border-border bg-white p-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">First name</Label>
              <Input value={form.firstName} onChange={update("firstName")} aria-invalid={!!errors.firstName} />
              {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last name</Label>
              <Input value={form.lastName} onChange={update("lastName")} aria-invalid={!!errors.lastName} />
              {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input type="email" value={form.email} onChange={update("email")} autoComplete="email" aria-invalid={!!errors.email} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
            <Input type="password" value={form.password} onChange={update("password")} autoComplete="new-password" aria-invalid={!!errors.password} />
            {errors.password ? (
              <p className="mt-1 text-xs text-destructive">{errors.password}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">At least 8 characters, including a letter and a number.</p>
            )}
          </div>
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{emailExists ? "Email already in use" : "Couldn't create account"}</AlertTitle>
              <AlertDescription>
                {errorMsg}
                {emailExists && (
                  <>
                    {" "}
                    <Link to="/{-$lang}/account/login" className="font-semibold underline">Sign in</Link>
                    {" · "}
                    <Link to="/{-$lang}/account/forgot-password" className="font-semibold underline">Reset password</Link>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/{-$lang}/account/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}