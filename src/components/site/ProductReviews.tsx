import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/site/AuthProvider";
import { createProductReview, listProductReviews } from "@/lib/woo/reviews.functions";

interface Props {
  productId: number;
  rating: number;
  reviewCount: number;
}

export function ProductReviews({ productId, rating, reviewCount }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const reviewsQuery = useQuery({
    queryKey: ["wc-reviews", productId],
    queryFn: () => listProductReviews({ data: { productId, page: 1, perPage: 20 } }),
    staleTime: 30_000,
  });

  const [ratingValue, setRatingValue] = useState(5);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createProductReview({
        data: { productId, rating: ratingValue, review: review.trim() },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error || "Could not submit your review.");
        return;
      }
      const status = res.review.status;
      if (status === "approved") {
        toast.success("Thanks! Your review is live.");
      } else {
        toast.success("Thanks! Your review has been submitted for moderation.");
      }
      setReview("");
      setRatingValue(5);
      void qc.invalidateQueries({ queryKey: ["wc-reviews", productId] });
      void qc.invalidateQueries({ queryKey: ["wc-product"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not submit your review.");
    },
  });

  const reviews = reviewsQuery.data ?? [];

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div className="h-fit rounded-xl border border-border bg-secondary p-6 text-center">
        <p className="text-5xl font-extrabold text-primary">{rating.toFixed(1)}</p>
        <div className="mt-2 inline-flex items-center gap-0.5 text-amber-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < Math.round(rating) ? "fill-current" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Based on {reviewCount} verified review{reviewCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-8">
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="text-lg font-bold text-foreground">Write a review</h3>
          {user ? (
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (review.trim().length < 3) {
                  toast.error("Please write a short review (3+ characters).");
                  return;
                }
                mutation.mutate();
              }}
            >
              <div>
                <label className="text-sm font-semibold text-foreground">Your rating</label>
                <div
                  className="mt-1.5 flex items-center gap-1"
                  onMouseLeave={() => setHover(0)}
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const v = i + 1;
                    const active = (hover || ratingValue) >= v;
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-label={`Rate ${v} star${v === 1 ? "" : "s"}`}
                        onMouseEnter={() => setHover(v)}
                        onClick={() => setRatingValue(v)}
                        className="p-1 text-amber-500 transition-transform hover:scale-110"
                      >
                        <Star className={`h-6 w-6 ${active ? "fill-current" : "text-muted-foreground/30"}`} />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {hover || ratingValue} / 5
                  </span>
                </div>
              </div>
              <div>
                <label htmlFor="review" className="text-sm font-semibold text-foreground">
                  Your review
                </label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Share your experience with this product…"
                  className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Posting as <span className="font-medium text-foreground">{user.displayName || user.email}</span>
                </p>
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {mutation.isPending ? "Submitting…" : "Submit review"}
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-border bg-secondary p-5 text-sm">
              <p className="text-foreground/80">
                Please sign in to share your rating and review.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/{-$lang}/account/login"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Sign in
                </Link>
                <Link
                  to="/{-$lang}/account/register"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold hover:border-primary hover:text-primary"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground">Customer reviews</h3>
          {reviewsQuery.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No reviews yet. Be the first to review this product.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {r.reviewer_avatar_urls?.["48"] && (
                        <img
                          src={r.reviewer_avatar_urls["48"]}
                          alt=""
                          className="h-9 w-9 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{r.reviewer}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.date_created).toLocaleDateString()}
                          {r.verified ? " · Verified buyer" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < r.rating ? "fill-current" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div
                    className="prose prose-sm mt-3 max-w-none text-foreground/85"
                    dangerouslySetInnerHTML={{ __html: r.review }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}