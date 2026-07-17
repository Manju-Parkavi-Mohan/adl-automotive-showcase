import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wcFetch } from "@/lib/woo/client.server";
import { getAppSession } from "@/lib/auth/session.server";
import type { WooOrderSummary } from "@/lib/woo/types";

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

const itemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
  variation_id: z.number().int().optional(),
});

/**
 * Expose the client-safe PayPal config to the browser. PAYPAL_CLIENT_ID is a
 * public identifier that must appear in the SDK <script> tag. PAYPAL_SECRET
 * and the OAuth access token are never returned here.
 */
export const getPayPalConfig = createServerFn({ method: "GET" }).handler(async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) throw new Error("PAYPAL_CLIENT_ID is not configured");
  const env = (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase() === "live"
    ? "live"
    : ("sandbox" as const);
  const currency = process.env.PAYPAL_CURRENCY ?? "USD";
  return { clientId, env, currency };
});

/**
 * Creates a WooCommerce order (status "pending"), then creates a matching
 * PayPal order with CAPTURE intent. Only the PayPal order ID is returned to
 * the client.
 */
export const createPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        items: z.array(itemSchema).min(1),
        billing: addressSchema,
        shipping: addressSchema.optional(),
        customer_note: z.string().optional(),
        currency: z.string().length(3).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = await getAppSession();
    const customerId = session.data?.customerId;
    const currency = (data.currency ?? process.env.PAYPAL_CURRENCY ?? "USD").toUpperCase();

    // 1) Create the Woo order.
    const wcRes = await wcFetch<{
      id: number;
      number: string;
      status: string;
      total: string;
      currency: string;
      date_created: string;
      order_key: string;
    }>("/orders", {
      method: "POST",
      body: {
        payment_method: "paypal",
        payment_method_title: "PayPal",
        set_paid: false,
        status: "pending",
        customer_id: customerId ?? 0,
        billing: data.billing,
        shipping: data.shipping ?? data.billing,
        line_items: data.items,
        customer_note: data.customer_note,
        currency,
      },
    });
    const wcOrder = wcRes.data;

    // 2) Create the PayPal order tied to the Woo order via custom_id.
    const { paypalFetch } = await import("./paypal.server");
    const ppRes = await paypalFetch<{ id: string; status: string }>(
      "/v2/checkout/orders",
      {
        method: "POST",
        body: {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: String(wcOrder.id),
              custom_id: String(wcOrder.id),
              amount: {
                currency_code: wcOrder.currency || currency,
                value: Number(wcOrder.total).toFixed(2),
              },
            },
          ],
          application_context: {
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
    );

    return {
      paypalOrderId: ppRes.data.id,
      wcOrderId: wcOrder.id,
      wcOrderNumber: wcOrder.number,
    };
  });

/**
 * Captures a previously-created PayPal order. On success flips the linked
 * Woo order to "processing" and stores the capture ID. On failure marks it
 * "failed" and surfaces an error message.
 */
export const captureOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ paypalOrderId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { paypalFetch } = await import("./paypal.server");

    type CaptureResp = {
      id: string;
      status: string;
      purchase_units?: Array<{
        reference_id?: string;
        custom_id?: string;
        payments?: {
          captures?: Array<{ id: string; status: string }>;
        };
      }>;
    };

    let capture: CaptureResp;
    try {
      const res = await paypalFetch<CaptureResp>(
        `/v2/checkout/orders/${encodeURIComponent(data.paypalOrderId)}/capture`,
        { method: "POST", body: {} },
      );
      capture = res.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "PayPal capture failed";
      return { ok: false as const, error: message };
    }

    const unit = capture.purchase_units?.[0];
    const wcOrderId = Number(unit?.custom_id ?? unit?.reference_id);
    const captureId = unit?.payments?.captures?.[0]?.id;
    const captureStatus = unit?.payments?.captures?.[0]?.status ?? capture.status;

    if (!wcOrderId || !Number.isFinite(wcOrderId)) {
      return { ok: false as const, error: "PayPal capture missing Woo order reference" };
    }

    if (captureStatus !== "COMPLETED") {
      try {
        await wcFetch(`/orders/${wcOrderId}`, {
          method: "PUT",
          body: { status: "failed" },
        });
      } catch {
        // ignore — best effort
      }
      return {
        ok: false as const,
        error: `Payment not completed (status: ${captureStatus})`,
      };
    }

    try {
      await wcFetch<WooOrderSummary>(`/orders/${wcOrderId}`, {
        method: "PUT",
        body: {
          status: "processing",
          transaction_id: captureId,
          meta_data: [
            { key: "_paypal_order_id", value: capture.id },
            { key: "_paypal_capture_id", value: captureId ?? "" },
          ],
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Order update failed";
      return { ok: false as const, error: message };
    }

    return {
      ok: true as const,
      wcOrderId,
      paypalOrderId: capture.id,
      captureId: captureId ?? null,
    };
  });