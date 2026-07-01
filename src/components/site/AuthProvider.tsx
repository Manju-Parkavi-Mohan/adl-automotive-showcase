import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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
  setUser: (user: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [localUser, setLocalUser] = useState<CurrentUser | null | undefined>(undefined);
  const { data, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => getCurrentUser(),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: localUser === undefined ? data ?? null : localUser,
      isLoading,
      refresh: async () => {
        setLocalUser(undefined);
        await qc.invalidateQueries({ queryKey: ["current-user"] });
      },
      setUser: (user) => {
        void qc.cancelQueries({ queryKey: ["current-user"] });
        setLocalUser(user);
        qc.setQueryData(["current-user"], user);
      },
    }),
    [data, isLoading, localUser, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}