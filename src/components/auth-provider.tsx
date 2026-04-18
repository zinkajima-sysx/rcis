"use client";

import {
  createContext,
  useEffect,
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
  | "id"
  | "username"
  | "namaLengkap"
  | "role"
  | "unit"
  | "entityId"
  | "entityName"
  | "accessValidFrom"
  | "accessValidUntil"
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

function isSessionOutsideAccessWindow(session: AuthSession | null) {
  if (!session) {
    return false;
  }

  const now = Date.now();

  if (session.accessValidFrom) {
    const validFrom = new Date(session.accessValidFrom).getTime();
    if (!Number.isNaN(validFrom) && validFrom > now) {
      return true;
    }
  }

  if (session.accessValidUntil) {
    const validUntil = new Date(session.accessValidUntil).getTime();
    if (!Number.isNaN(validUntil) && validUntil < now) {
      return true;
    }
  }

  return false;
}

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as AuthSession;

    if (isSessionOutsideAccessWindow(parsedSession)) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return parsedSession;
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

  useEffect(() => {
    if (!session) {
      return;
    }

    if (isSessionOutsideAccessWindow(session)) {
      logout();
      return;
    }

    if (!session.accessValidUntil) {
      return;
    }

    const validUntilTime = new Date(session.accessValidUntil).getTime();
    if (Number.isNaN(validUntilTime)) {
      return;
    }

    const timeoutMs = validUntilTime - Date.now() + 1000;
    if (timeoutMs <= 0) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logout();
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [session]);

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
