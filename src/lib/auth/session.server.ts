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
  return {
    password,
    name: "adl_session",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: true,
      path: "/",
    },
  };
}

export async function getAppSession() {
  return useSession<AppSessionData>(getSessionConfig());
}