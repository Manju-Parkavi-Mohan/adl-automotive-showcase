import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/paypal")({
  server: {
    handlers: {
      // Reachability probes from PayPal / uptime checks.
      GET: async () => new Response("ok", { status: 200 }),
      HEAD: async () => new Response(null, { status: 200 }),
      POST: async ({ request }) => {
        const raw = await request.text();
        let payload: {
          id?: string;
          event_type?: string;
          resource?: {
            id?: string;
            status?: string;
            custom_id?: string;
            invoice_id?: string;
            supplementary_data?: {
              related_ids?: { order_id?: string };
            };
          };
        };
        try {
          payload = raw ? JSON.parse(raw) : {};
        } catch {
          return new Response("Bad Request", { status: 400 });
        }

        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        if (!webhookId) {
          console.error("[paypal webhook] PAYPAL_WEBHOOK_ID not configured");
          return new Response("Webhook not configured", { status: 500 });
        }

        // Verify signature with PayPal.
        const headers = request.headers;
        const verifyBody = {
          auth_algo: headers.get("paypal-auth-algo") ?? "",
          cert_url: headers.get("paypal-cert-url") ?? "",
          transmission_id: headers.get("paypal-transmission-id") ?? "",
          transmission_sig: headers.get("paypal-transmission-sig") ?? "",
          transmission_time: headers.get("paypal-transmission-time") ?? "",
          webhook_id: webhookId,
          webhook_event: payload,
        };

        try {
          const { paypalFetch } = await import("@/lib/paypal/paypal.server");
          const verify = await paypalFetch<{ verification_status: string }>(
            "/v1/notifications/verify-webhook-signature",
            { method: "POST", body: verifyBody },
          );
          if (verify.data.verification_status !== "SUCCESS") {
            console.warn("[paypal webhook] signature verification failed", verify.data);
            return new Response("Invalid signature", { status: 401 });
          }
        } catch (err) {
          console.error("[paypal webhook] verify error", err);
          return new Response("Invalid signature", { status: 401 });
        }

        const eventType = payload.event_type ?? "unknown";
        const resource = payload.resource ?? {};
        const wcOrderIdRaw = resource.custom_id ?? resource.invoice_id;
        const wcOrderId = Number(wcOrderIdRaw);

        if (!wcOrderId || !Number.isFinite(wcOrderId)) {
          console.warn("[paypal webhook] no Woo order reference on event", eventType);
          return new Response("ok", { status: 200 });
        }

        try {
          const { wcFetch } = await import("@/lib/woo/client.server");

          if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
            // Idempotent: fetch current status first so we don't clobber a
            // completed order.
            const current = await wcFetch<{ status: string }>(`/orders/${wcOrderId}`);
            if (!["processing", "completed"].includes(current.data.status)) {
              await wcFetch(`/orders/${wcOrderId}`, {
                method: "PUT",
                body: {
                  status: "processing",
                  transaction_id: resource.id ?? "",
                  meta_data: [
                    { key: "_paypal_capture_id", value: resource.id ?? "" },
                    {
                      key: "_paypal_order_id",
                      value: resource.supplementary_data?.related_ids?.order_id ?? "",
                    },
                  ],
                },
              });
            }
          } else if (eventType === "PAYMENT.CAPTURE.DENIED") {
            await wcFetch(`/orders/${wcOrderId}`, {
              method: "PUT",
              body: { status: "failed" },
            });
          } else if (
            eventType === "PAYMENT.CAPTURE.REFUNDED" ||
            eventType === "PAYMENT.CAPTURE.REVERSED"
          ) {
            await wcFetch(`/orders/${wcOrderId}`, {
              method: "PUT",
              body: { status: "refunded" },
            });
          }
        } catch (err) {
          console.error("[paypal webhook] order sync failed", err);
          // Return 200 anyway so PayPal doesn't retry endlessly on a Woo blip;
          // we've already verified the signature.
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});