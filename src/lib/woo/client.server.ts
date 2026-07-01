import { setResponseStatus } from "@tanstack/react-start/server";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required server env var ${name}`);
  return v;
}

function wcBase(): string {
  const raw = requireEnv("WORDPRESS_SITE_URL").replace(/\/+$/, "");
  return `${raw}/wp-json/wc/v3`;
}

function wcBasicAuthHeader(): string {
  const key = requireEnv("WOOCOMMERCE_CONSUMER_KEY");
  const secret = requireEnv("WOOCOMMERCE_CONSUMER_SECRET");
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

export type WcQuery = Record<string, string | number | boolean | undefined | null>;

function buildQs(q?: WcQuery): string {
  if (!q) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export interface WcResponse<T> {
  data: T;
  totalItems: number;
  totalPages: number;
  status: number;
}

export async function wcFetch<T>(
  path: string,
  init: { method?: string; query?: WcQuery; body?: unknown } = {},
): Promise<WcResponse<T>> {
  const url = `${wcBase()}${path.startsWith("/") ? path : `/${path}`}${buildQs(init.query)}`;

  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      Authorization: wcBasicAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // ignore; will throw below
  }

  if (!res.ok) {
    const msg =
      (parsed && typeof parsed === "object" && "message" in parsed && typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : `WooCommerce request failed (${res.status})`);
    setResponseStatus(502);
    throw new Error(`Woo ${path}: ${msg}`);
  }

  const total = Number(res.headers.get("x-wp-total") ?? 0);
  const totalPages = Number(res.headers.get("x-wp-totalpages") ?? 1);

  return {
    data: parsed as T,
    totalItems: Number.isFinite(total) ? total : 0,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
    status: res.status,
  };
}

// ---- WordPress REST (public posts/pages) ----

function wpBase(): string {
  const raw = requireEnv("WORDPRESS_SITE_URL").replace(/\/+$/, "");
  return raw;
}

export async function wpFetch<T>(
  path: string,
  init: { method?: string; query?: WcQuery; body?: unknown; token?: string } = {},
): Promise<WcResponse<T>> {
  const url = `${wpBase()}${path.startsWith("/") ? path : `/${path}`}${buildQs(init.query)}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      parsed && typeof parsed === "object" && "message" in parsed && typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : `WordPress request failed (${res.status})`;
    throw new Error(`WP ${path}: ${msg}`);
  }

  const total = Number(res.headers.get("x-wp-total") ?? 0);
  const totalPages = Number(res.headers.get("x-wp-totalpages") ?? 1);

  return {
    data: parsed as T,
    totalItems: Number.isFinite(total) ? total : 0,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
    status: res.status,
  };
}