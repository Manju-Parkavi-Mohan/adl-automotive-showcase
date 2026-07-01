import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wcFetch } from "./client.server";
import { getAppSession } from "@/lib/auth/session.server";
import type { WooOrderSummary } from "./types";

const addressSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  address_1: z.string().min(1),
  address_2: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().optional().default(""),
  postcode: z.string().min(1),
  country: z.string().length(2),
  email: z.string().email().optional(),
  phone: z.string().optional().default(""),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        items: z
          .array(
            z.object({
              product_id: z.number().int().positive(),
              quantity: z.number().int().min(1).max(99),
              variation_id: z.number().int().optional(),
            }),
          )
          .min(1),
        billing: addressSchema,
        shipping: addressSchema.optional(),
        customer_note: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getAppSession();
    const customerId = session.data?.customerId;

    const res = await wcFetch<{
      id: number;
      number: string;
      status: string;
      total: string;
      currency: string;
      date_created: string;
    }>("/orders", {
      method: "POST",
      body: {
        payment_method: "cod",
        payment_method_title: "Cash on Delivery (Demo)",
        set_paid: false,
        status: "pending",
        customer_id: customerId ?? 0,
        billing: data.billing,
        shipping: data.shipping ?? data.billing,
        line_items: data.items,
        customer_note: data.customer_note,
      },
    });
    return {
      id: res.data.id,
      number: res.data.number,
      status: res.data.status,
      total: res.data.total,
      currency: res.data.currency,
      date_created: res.data.date_created,
    } satisfies WooOrderSummary;
  });

export const listMyOrders = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAppSession();
  const customerId = session.data?.customerId;
  const email = session.data?.email;
  if (!customerId && !email) return [] as WooOrderSummary[];

  type RawOrder = {
    id: number;
    number: string;
    status: string;
    total: string;
    currency: string;
    date_created: string;
    billing?: { email?: string };
  };

  const collected = new Map<number, RawOrder>();

  if (customerId) {
    try {
      const res = await wcFetch<RawOrder[]>("/orders", {
        query: { customer: customerId, per_page: 25, orderby: "date", order: "desc" },
      });
      for (const o of res.data ?? []) collected.set(o.id, o);
    } catch {
      // ignore and fall through to email search
    }
  }

  // Fallback: guest orders or orders where customer_id != WP user id
  if (email) {
    try {
      const res = await wcFetch<RawOrder[]>("/orders", {
        query: { search: email, per_page: 25, orderby: "date", order: "desc" },
      });
      for (const o of res.data ?? []) {
        if (o.billing?.email?.toLowerCase() === email.toLowerCase()) {
          collected.set(o.id, o);
        }
      }
    } catch {
      // ignore
    }
  }

  const orders = Array.from(collected.values()).sort(
    (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime(),
  );

  return orders.map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    total: o.total,
    currency: o.currency,
    date_created: o.date_created,
  }));
});