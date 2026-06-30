import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { listPosts } from "@/lib/wp/posts.functions";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: [{ title: "Blog — ADL Automotive" }] }),
  component: BlogIndex,
});

function BlogIndex() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["wp-posts", page],
    queryFn: () => listPosts({ data: { page, perPage: 9 } }),
    placeholderData: keepPreviousData,
  });

  const posts = query.data?.items ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-px mx-auto max-w-[1400px] py-12">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">From the workshop</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Blog & Insights</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Diagnostic walkthroughs, ECU tuning insights and product announcements.
          </p>
        </header>

        <div className="mt-10">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading posts…</p>
          ) : query.isError ? (
            <p className="text-sm text-destructive">
              Couldn't load posts. {query.error instanceof Error ? query.error.message : ""}
            </p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-[var(--shadow-hover)]"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-secondary">
                    {p.featuredImage ? (
                      <img src={p.featuredImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                    <h2
                      className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary"
                      dangerouslySetInnerHTML={{ __html: p.title }}
                    />
                    <div
                      className="line-clamp-3 text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: p.excerpt }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {query.data && query.data.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-10 rounded-md border border-border px-4 text-sm font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {query.data.totalPages}
              </span>
              <button
                disabled={page >= (query.data.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="h-10 rounded-md border border-border px-4 text-sm font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}