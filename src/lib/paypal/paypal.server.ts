// Server-only helpers for PayPal REST API access. Never import this from
// route or *.functions.ts module scope — load it inside handler bodies only.

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required server env var ${name}`);
  return v;
}

export function paypalBaseUrl(): string {
  const env = (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase();
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

let cached: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const clientId = requireEnv("PAYPAL_CLIENT_ID");
  const secret = requireEnv("PAYPAL_SECRET");
  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal auth failed (${res.status}): ${text}`);
  }
  const json = JSON.parse(text) as { access_token: string; expires_in: number };
  cached = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

export async function paypalFetch<T>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<{ status: number; data: T }> {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${paypalBaseUrl()}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
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
      parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as { message: unknown }).message)
        : `PayPal ${path} failed (${res.status})`;
    throw new Error(msg);
  }
  return { status: res.status, data: parsed as T };
}