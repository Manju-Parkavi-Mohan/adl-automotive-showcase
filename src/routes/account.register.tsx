import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { register } from "@/lib/auth/wp-auth.functions";
import { useAuth } from "@/components/site/AuthProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/account/register")({
  head: () => ({ meta: [{ title: "Create account — ADL Automotive" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });

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
      navigate({ to: "/account" }).catch(() => {});
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create account"),
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto flex max-w-md flex-col py-16">
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Join ADL Automotive to track orders and check out faster.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="mt-8 space-y-4 rounded-xl border border-border bg-white p-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">First name</Label>
              <Input value={form.firstName} onChange={update("firstName")} required />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last name</Label>
              <Input value={form.lastName} onChange={update("lastName")} required />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input type="email" value={form.email} onChange={update("email")} required autoComplete="email" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
            <Input type="password" value={form.password} onChange={update("password")} required minLength={8} autoComplete="new-password" />
            <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/account/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}