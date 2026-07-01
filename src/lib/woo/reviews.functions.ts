import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wcFetch } from "./client.server";
import { getAppSession } from "@/lib/auth/session.server";

export interface WooReview {
  id: number;
  date_created: string;
  product_id: number;
  status: string;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  reviewer_avatar_urls?: Record<string, string>;
}

export const listProductReviews = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.number().int().positive(),
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(50).default(10),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<WooReview[]> => {
    const res = await wcFetch<WooReview[]>("/products/reviews", {
      query: {
        product: data.productId,
        page: data.page,
        per_page: data.perPage,
        status: "approved",
      },
    });
    return res.data ?? [];
  });

export const createProductReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.number().int().positive(),
        rating: z.number().int().min(1).max(5),
        review: z.string().trim().min(3).max(2000),
        reviewerName: z.string().trim().max(100).optional(),
        reviewerEmail: z.string().trim().email().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true; review: WooReview } | { ok: false; error: string }> => {
    const session = await getAppSession();
    const email = data.reviewerEmail ?? session.data.email;
    const fullName = [session.data.firstName, session.data.lastName].filter(Boolean).join(" ").trim();
    const name =
      data.reviewerName ?? session.data.displayName ?? (fullName.length > 0 ? fullName : undefined);

    if (!email || !name) {
      return { ok: false, error: "Please sign in to submit a review." };
    }

    try {
      const res = await wcFetch<WooReview>("/products/reviews", {
        method: "POST",
        body: {
          product_id: data.productId,
          review: data.review,
          reviewer: name,
          reviewer_email: email,
          rating: data.rating,
        },
      });
      return { ok: true, review: res.data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit review";
      return { ok: false, error: msg.replace(/^Woo [^:]+:\s*/, "") };
    }
  });