"use client";

import {
  createContext,
  startTransition,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";

import type { AppUser } from "@/lib/types";
import { loginAction } from "@/lib/auth-actions";

const SESSION_STORAGE_KEY = "rci-session";

type AuthSession = Pick<
  AppUser,
  "id" | "username" | "namaLengkap" | "role" | "unit"
>;

type LoginInput = {
  username: string;
  password: string;
};

type AuthContextValue = {
  isReady: boolean;
  session: AuthSession | null;
  login: (input: LoginInput) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [session, setSession] = useState<AuthSession | null>(() =>
    readStoredSession()
  );

  const login: AuthContextValue["login"] = async ({ username, password }) => {
    const result = await loginAction({ username, password });

    if (!result.ok) {
      return {
        ok: false,
        message: result.message || "Terjadi kesalahan saat login. Silakan coba lagi.",
      };
    }

    const nextSession = result.session as AuthSession;
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    startTransition(() => setSession(nextSession));

    return { ok: true };
  };

  const logout = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    startTransition(() => setSession(null));
  };

  return (
    <AuthContext.Provider value={{ isReady, session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
