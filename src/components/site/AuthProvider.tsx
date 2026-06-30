import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/wp-auth.functions";

export interface CurrentUser {
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  customerId: number | null;
}

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => getCurrentUser(),
    staleTime: 60_000,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading,
      refresh: async () => {
        await qc.invalidateQueries({ queryKey: ["current-user"] });
      },
    }),
    [data, isLoading, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}