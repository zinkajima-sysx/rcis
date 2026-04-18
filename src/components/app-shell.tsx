"use client";

import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { DevResetButton } from "@/components/dev-reset-button";
import { InstallPromptButton } from "@/components/install-prompt";
import { HeaderNavigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLong, formatRoleLabel } from "@/lib/rci-utils";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { logout, session } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div className="flex min-w-0 flex-col">
                <div className="truncate text-lg font-semibold text-foreground">
                  Rail Clinic Inventory
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDaysIcon className="size-4" />
                    {formatDateLong("2026-04-18")}
                  </span>
                  <span>&bull;</span>
                  <span>{session ? formatRoleLabel(session.role) : "Pengguna"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <ShieldCheckIcon data-icon="inline-start" />
                  {session?.unit ?? "Sesi aktif"}
                </Badge>
                <Badge variant="outline">
                  <UserRoundIcon data-icon="inline-start" />
                  {session?.namaLengkap ?? "Pengguna"}
                </Badge>
                <DevResetButton compact />
                <InstallPromptButton />
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    router.replace("/login");
                  }}
                >
                  <LogOutIcon data-icon="inline-start" />
                  Logout
                </Button>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <HeaderNavigation />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
