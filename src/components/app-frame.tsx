"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";

type AppFrameProps = {
  children: React.ReactNode;
};

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="surface-panel flex w-full max-w-md flex-col gap-3 rounded-3xl border border-white/70 p-8 text-center shadow-lg shadow-primary/5">
        <div className="text-lg font-semibold text-foreground">
          Menyiapkan Rail Clinic Inventory
        </div>
        <div className="text-sm leading-7 text-muted-foreground">
          Memuat sesi pengguna dan struktur aplikasi.
        </div>
      </div>
    </div>
  );
}

export function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, session } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (session && pathname === "/login") {
      router.replace("/");
    }
  }, [isReady, pathname, router, session]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!session && pathname !== "/login") {
    return <LoadingScreen />;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
