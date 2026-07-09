import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

export const Route = createFileRoute("/api/public/checkout/webhook")({
  server: {
    handlers: {
      // CKO dashboard's "Test endpoint" issues a GET/HEAD to confirm reachability.
      GET: async () => new Response("ok", { status: 200 }),
      HEAD: async () => new Response(null, { status: 200 }),
      POST: async ({ request }) => {
        const raw = await request.text();
        const signatureHeader =
          request.headers.get("cko-signature") ||
          request.headers.get("checkout-signature") ||
          "";

        const secret = process.env.CHECKOUT_WEBHOOK_SECRET;
        if (secret && signatureHeader) {
          try {
            const expected = createHmac("sha256", secret).update(raw).digest("hex");
            const a = Buffer.from(expected, "utf8");
            const b = Buffer.from(signatureHeader, "utf8");
            if (a.length !== b.length || !timingSafeEqual(a, b)) {
              console.warn("[cko webhook] signature mismatch");
              return new Response("Invalid signature", { status: 401 });
            }
          } catch (err) {
            console.error("[cko webhook] signature verification error", err);
            return new Response("Invalid signature", { status: 401 });
          }
        }

        try {
          const payload = raw ? JSON.parse(raw) : {};
          console.log("[cko webhook] event", payload?.type ?? "unknown", payload?.data?.id ?? "");
          // Order reconciliation is wired up in a follow-up step once payment
          // creation is live. Acknowledge quickly so CKO does not retry.
        } catch (err) {
          console.error("[cko webhook] invalid JSON", err);
          return new Response("Bad Request", { status: 400 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});