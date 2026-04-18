"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ActivitySquareIcon,
  BuildingIcon,
  CalendarIcon,
  FileTextIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PackageSearchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatRoleLabel } from "@/lib/rci-utils";
import { cn } from "@/lib/utils";

export const navigationItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    roles: ["petugas_medis", "manajemen", "admin", "super_admin"],
  },
  {
    href: "/gallery",
    label: "Galeri",
    icon: FolderOpenIcon,
    roles: ["petugas_medis", "manajemen", "admin", "super_admin"],
  },
  {
    href: "/inventory",
    label: "Alkes",
    icon: PackageSearchIcon,
    roles: ["petugas_medis", "manajemen", "admin", "super_admin"],
  },
  {
    href: "/handover",
    label: "Handover",
    icon: FileTextIcon,
    roles: ["petugas_medis", "manajemen", "admin", "super_admin"],
  },
  {
    href: "/schedule",
    label: "Jadwal RC",
    icon: CalendarIcon,
    roles: ["petugas_medis", "manajemen", "admin", "super_admin"],
  },
  {
    href: "/users",
    label: "User",
    icon: UsersIcon,
    category: "Data Master",
    roles: ["admin", "super_admin"],
  },
  {
    href: "/entities",
    label: "Daop/Divre",
    icon: BuildingIcon,
    category: "Data Master",
    roles: ["admin", "super_admin"],
  },
  {
    href: "/entities/types",
    label: "Entitas",
    icon: ShieldCheckIcon,
    category: "Data Master",
    roles: ["admin", "super_admin"],
  },
];

function NavigationLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const { session } = useAuth();

  const allowedItems = navigationItems.filter(
    (item) => session?.role && item.roles.includes(session.role)
  );

  const mainItems = allowedItems.filter((item) => !item.category);
  const masterDataItems = allowedItems.filter(
    (item) => item.category === "Data Master"
  );

  const renderItem = (item: (typeof navigationItems)[0]) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
          isActive
            ? "border-white/10 bg-white text-sidebar shadow-sm"
            : "border-white/5 bg-white/0 text-sidebar-foreground/80 hover:bg-white/8 hover:text-sidebar-foreground",
          compact && (isActive ? "bg-primary text-primary-foreground" : "bg-background text-foreground")
        )}
      >
        <div
          className={cn(
            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
            isActive
              ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
              : "bg-white/10 text-sidebar-foreground group-hover:bg-white/20",
            compact && !isActive && "bg-secondary text-primary",
            compact && isActive && "bg-white/20 text-white"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex min-w-0 flex-col justify-center py-1.5">
          <span className="font-medium">{item.label}</span>
        </div>
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">{mainItems.map(renderItem)}</div>

      {masterDataItems.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="px-4 pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Data Master
          </div>
          {masterDataItems.map(renderItem)}
        </div>
      )}
    </nav>
  );
}

export function DesktopNavigation() {
  const { session } = useAuth();

  return (
    <aside className="surface-panel hidden w-80 shrink-0 border-r border-white/50 px-5 py-6 lg:flex lg:flex-col lg:gap-6">
      <div className="rounded-3xl bg-sidebar px-5 py-5 text-sidebar-foreground shadow-lg shadow-primary/15">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <ActivitySquareIcon />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-sidebar-foreground/70">
              PT KAI
            </span>
            <span className="text-lg font-semibold">Rail Clinic Inventory</span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-sidebar-foreground/75">
          Inventaris alat kesehatan Rail Clinic.
        </p>
        <div className="mt-4 rounded-2xl bg-white/8 px-4 py-3">
          <div className="text-sm font-medium">
            {session?.namaLengkap ?? "Pengguna aktif"}
          </div>
          <div className="mt-1 text-sm text-sidebar-foreground/70">
            {session
              ? `${formatRoleLabel(session.role)} • ${session.unit}`
              : "Belum login"}
          </div>
        </div>
      </div>

      <NavigationLinks />
    </aside>
  );
}

export function MobileNavigation() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Buka menu navigasi"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground lg:hidden"
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="surface-panel w-[88vw] max-w-sm">
        <SheetHeader>
          <SheetTitle>Rail Clinic Inventory</SheetTitle>
          <SheetDescription>Menu</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <NavigationLinks compact />
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
      </SheetContent>
    </Sheet>
  );
}

export function HeaderNavigation() {
  const pathname = usePathname();
  const { session } = useAuth();

  const allowedItems = navigationItems.filter(item =>
    session?.role && item.roles.includes(session.role)
  );

  return (
    <nav className="flex flex-wrap gap-2">
      {allowedItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
