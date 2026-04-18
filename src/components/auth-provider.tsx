"use client";

import {
  createContext,
  startTransition,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";

import { appUsers, type AppUser } from "@/lib/rci-data";

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
  login: (input: LoginInput) => { ok: true } | { ok: false; message: string };
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

function toSession(user: AppUser): AuthSession {
  return {
    id: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: user.role,
    unit: user.unit,
  };
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

  const login: AuthContextValue["login"] = ({ username, password }) => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const user = appUsers.find(
      (entry) =>
        entry.username.toLowerCase() === normalizedUsername &&
        entry.password === normalizedPassword
    );

    if (!user) {
      return {
        ok: false,
        message:
          "Username atau password belum cocok. Coba salah satu akun demo yang tersedia.",
      };
    }

    const nextSession = toSession(user);
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
