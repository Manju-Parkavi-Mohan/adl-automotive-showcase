import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
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

export const Route = createFileRoute("/account/login")({
  head: () => ({ meta: [{ title: "Sign in — ADL Automotive" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
      navigate({ to: "/account" }).catch(() => {});
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
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="mt-8 space-y-4 rounded-xl border border-border bg-white p-6"
        >
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email or username
            </Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/account/register" className="font-semibold text-primary hover:underline">Create one</Link>
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