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
    await wcFetch<RawWooCustomer>("/customers", {
      method: "POST",
      body: {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });
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
    return { email: data.email, customerId: customer?.id ?? null };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAppSession();
  await session.clear();
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