import { useSession } from "@tanstack/react-start/server";

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
  // `secure: true` prevents browsers from accepting the cookie over plain
  // http (e.g. localhost dev). Only enable it in production.
  const isProd = process.env.NODE_ENV === "production";
  return {
    password,
    name: "adl_session",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: isProd,
      path: "/",
    },
  };
}

export async function getAppSession() {
  return useSession<AppSessionData>(getSessionConfig());
}