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
import { login } from "@/lib/auth/wp-auth.functions";
import { useAuth } from "@/components/site/AuthProvider";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { seoToMeta } from "@/lib/seo";

export const Route = createFileRoute("/{-$lang}/account/login")({
  head: () => ({
    meta: seoToMeta(undefined, {
      title: "Sign in — ADL Automotive",
      description: "Sign in to your ADL Automotive account to track orders and manage addresses.",
      keywords: "ADL Automotive login, customer sign in",
      url: "/account/login",
    }).concat([{ name: "robots", content: "noindex, nofollow" }]),
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const schema = z.object({
    username: z.string().trim().min(1, "Please enter your email address.").email("Please enter a valid email address."),
    password: z.string().min(1, "Please enter your password."),
  });

  const mutation = useMutation({
    mutationFn: () => login({ data: { username, password } }),
    onSuccess: async (data) => {
      setUser({
        email: data.email,
        displayName: data.displayName,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        customerId: data.customerId,
      });
      toast.success("Signed in");
      navigate({ to: "/{-$lang}/account" }).catch(() => {});
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Login failed"),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto flex max-w-md flex-col py-16">
        <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Welcome back to ADL Automotive.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = schema.safeParse({ username, password });
            if (!parsed.success) {
              const errs: { username?: string; password?: string } = {};
              for (const issue of parsed.error.issues) {
                const k = issue.path[0] as "username" | "password";
                if (!errs[k]) errs[k] = issue.message;
              }
              setFieldErrors(errs);
              return;
            }
            setFieldErrors({});
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="email"
              aria-invalid={!!fieldErrors.username}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.username}</p>
            )}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Link
                to="/{-$lang}/account/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "We couldn't verify your credentials. Please double-check your email and password, then try again."}
                {" "}
                <Link to="/{-$lang}/account/forgot-password" className="font-semibold underline">Reset password</Link>
                {" · "}
                <Link to="/{-$lang}/account/register" className="font-semibold underline">Create an account</Link>
              </AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/{-$lang}/account/register" className="font-semibold text-primary hover:underline">Create one</Link>
          </p>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Secure access for order history, saved addresses, and faster checkout.
        </p>
      </main>
      <Footer />
    </div>
  );
}