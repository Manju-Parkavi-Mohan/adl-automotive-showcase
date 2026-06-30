import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/site/AuthProvider";
import { logout } from "@/lib/auth/wp-auth.functions";
import { listMyOrders } from "@/lib/woo/orders.functions";

export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "My Account — ADL Automotive" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isLoading, refresh } = useAuth();
  const navigate = useNavigate();

  const ordersQuery = useQuery({
    queryKey: ["my-orders", user?.customerId],
    queryFn: () => listMyOrders(),
    enabled: !!user,
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: async () => {
      await refresh();
      navigate({ to: "/" }).catch(() => {});
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-px mx-auto max-w-[1400px] py-20 text-center text-sm text-muted-foreground">Loading…</div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-px mx-auto max-w-[1400px] py-20 text-center">
          <h1 className="text-2xl font-bold">You're not signed in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your ADL Automotive account.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link to="/account/login">Login</Link></Button>
            <Button asChild variant="outline"><Link to="/account/register">Create account</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {user.displayName || user.firstName || user.email}
            </p>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            {logoutMutation.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </div>

        <section className="mt-8 rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          {ordersQuery.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading orders…</p>
          ) : ordersQuery.data && ordersQuery.data.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4">Order</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersQuery.data.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-semibold">#{o.number}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{new Date(o.date_created).toLocaleDateString()}</td>
                      <td className="py-3 pr-4 capitalize">{o.status}</td>
                      <td className="py-3 pr-4 text-right font-semibold">
                        {Number(o.total).toLocaleString("en-US", { style: "currency", currency: o.currency || "USD" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}