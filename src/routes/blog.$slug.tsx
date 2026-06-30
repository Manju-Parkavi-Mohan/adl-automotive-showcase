import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getPostBySlug } from "@/lib/wp/posts.functions";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({ meta: [{ title: "Blog — ADL Automotive" }] }),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const query = useQuery({
    queryKey: ["wp-post", slug],
    queryFn: () => getPostBySlug({ data: { slug } }),
  });

  const post = query.data;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b border-border bg-secondary">
        <div className="container-px mx-auto max-w-[1400px] py-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="line-clamp-1 max-w-xs font-medium text-foreground">
                {post ? <span dangerouslySetInnerHTML={{ __html: post.title }} /> : slug}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="container-px mx-auto max-w-3xl py-12">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !post ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary p-10 text-center">
            <p className="font-semibold">Post not found</p>
            <Link to="/blog" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Back to blog
            </Link>
          </div>
        ) : (
          <article className="space-y-6">
            <header>
              <p className="text-xs text-muted-foreground">
                {new Date(post.date).toLocaleDateString()} {post.author ? `· ${post.author}` : ""}
              </p>
              <h1
                className="mt-2 text-4xl font-bold tracking-tight"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
            </header>
            {post.featuredImage && (
              <img src={post.featuredImage} alt="" className="w-full rounded-xl object-cover" />
            )}
            <div
              className="prose prose-slate max-w-none text-foreground/85"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}