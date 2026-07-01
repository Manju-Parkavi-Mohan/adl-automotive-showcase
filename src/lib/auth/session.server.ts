import { getRequestUrl, useSession } from "@tanstack/react-start/server";

export interface AppSessionData {
  jwt?: string;
  customerId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

const FALLBACK = "lovable-dev-session-secret-please-rotate-via-update_secret-tool";

export function getSessionConfig() {
  const password = process.env.SESSION_SECRET || FALLBACK;
  // Preview runs inside a cross-site iframe. Session cookies need
  // SameSite=None + Secure there, while localhost still needs plain http.
  let isHttpsRequest = false;
  try {
    isHttpsRequest = getRequestUrl().protocol === "https:";
  } catch {
    isHttpsRequest = false;
  }
  const secureCookie = process.env.NODE_ENV === "production" || isHttpsRequest;
  return {
    password,
    name: "adl_session",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    cookie: {
      httpOnly: true,
      sameSite: secureCookie ? ("none" as const) : ("lax" as const),
      secure: secureCookie,
      ...(secureCookie ? { partitioned: true } : {}),
      path: "/",
    },
  };
}

export async function getAppSession() {
  return useSession<AppSessionData>(getSessionConfig());
}