import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wcFetch, wpFetch } from "@/lib/woo/client.server";
import { getAppSession } from "./session.server";
import type { WooCustomer } from "@/lib/woo/types";

interface JwtTokenResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

interface RawWooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
}

function adaptCustomer(c: RawWooCustomer): WooCustomer {
  return {
    id: c.id,
    email: c.email,
    first_name: c.first_name,
    last_name: c.last_name,
    username: c.username,
    billing: c.billing,
    shipping: c.shipping,
  };
}

async function findCustomerByEmail(email: string): Promise<WooCustomer | null> {
  try {
    const res = await wcFetch<RawWooCustomer[]>("/customers", {
      query: { email, per_page: 1, role: "all" },
    });
    const c = res.data?.[0];
    return c ? adaptCustomer(c) : null;
  } catch {
    return null;
  }
}

export const login = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const res = await wpFetch<JwtTokenResponse>("/wp-json/jwt-auth/v1/token", {
      method: "POST",
      body: { username: data.username, password: data.password },
    });
    const token = res.data?.token;
    if (!token) throw new Error("Login failed: no token returned");

    const customer = await findCustomerByEmail(res.data.user_email);

    const session = await getAppSession();
    await session.update({
      jwt: token,
      customerId: customer?.id,
      email: res.data.user_email,
      firstName: customer?.first_name,
      lastName: customer?.last_name,
      displayName: res.data.user_display_name,
    });

    return {
      email: res.data.user_email,
      displayName: res.data.user_display_name,
      firstName: customer?.first_name ?? null,
      lastName: customer?.last_name ?? null,
      customerId: customer?.id ?? null,
    };
  });

export const register = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      await wcFetch<RawWooCustomer>("/customers", {
        method: "POST",
        body: {
          email: data.email,
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (
        lower.includes("registration-error-email-exists") ||
        lower.includes("email address is already") ||
        lower.includes("already registered") ||
        lower.includes("email_exists") ||
        lower.includes("existing_user_email")
      ) {
        throw new Error("An account with this email already exists. Please sign in instead or use the forgot password link.");
      }
      if (lower.includes("invalid_email") || lower.includes("not a valid email")) {
        throw new Error("Please enter a valid email address.");
      }
      if (lower.includes("password")) {
        throw new Error("Password doesn't meet the requirements. Use at least 8 characters.");
      }
      throw new Error("We couldn't create your account. Please check your details and try again.");
    }
    const res = await wpFetch<JwtTokenResponse>("/wp-json/jwt-auth/v1/token", {
      method: "POST",
      body: { username: data.email, password: data.password },
    });
    const customer = await findCustomerByEmail(data.email);
    const session = await getAppSession();
    await session.update({
      jwt: res.data.token,
      customerId: customer?.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: res.data.user_display_name || `${data.firstName} ${data.lastName}`,
    });
    return {
      email: data.email,
      displayName: res.data.user_display_name || `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      lastName: data.lastName,
      customerId: customer?.id ?? null,
    };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAppSession();
  await session.clear();
  return { ok: true };
});

// Send a password reset email via the standard WordPress lost-password flow.
// Posts form-encoded data to wp-login.php?action=lostpassword. For security we
// always return { ok: true } so we don't leak which emails exist.
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().email() }).parse(input),
  )
  .handler(async ({ data }) => {
    const base = (process.env.WORDPRESS_SITE_URL || "").replace(/\/+$/, "");
    if (!base) throw new Error("Server not configured");
    const url = `${base}/wp-login.php?action=lostpassword`;
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "text/html",
        },
        body: new URLSearchParams({
          user_login: data.email,
          redirect_to: "",
          wp_lang: "",
        }).toString(),
        redirect: "manual",
      });
    } catch {
      // swallow — we always return ok
    }
    return { ok: true };
  });

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAppSession();
  if (!session.data?.jwt) return null;
  return {
    email: session.data.email ?? null,
    displayName: session.data.displayName ?? null,
    firstName: session.data.firstName ?? null,
    lastName: session.data.lastName ?? null,
    customerId: session.data.customerId ?? null,
  };
});