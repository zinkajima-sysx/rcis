"use client";

import { startTransition, useState, useTransition } from "react";
import {
  EditIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  TrashIcon,
  UserCheckIcon,
  UserIcon,
  UserMinusIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatRoleLabel } from "@/lib/rci-utils";
import type { AppUser } from "@/lib/types";
import { UserForm } from "./user-form";
import { toggleUserStatusAction } from "@/lib/user-actions";

type UserManagementProps = {
  users: AppUser[];
  roles: { id: string; name: string }[];
  entities: { id: string; name: string }[];
};

export function UserManagement({ users, roles, entities }: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<AppUser | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    setSelectedUser(undefined);
    setIsSheetOpen(true);
  };

  const handleEdit = (user: AppUser) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };

  const handleToggleStatus = (user: AppUser) => {
    if (confirm(`Apakah Anda yakin ingin ${user.isActive ? 'menonaktifkan' : 'mengaktifkan'} user ${user.username}?`)) {
      startTransition(async () => {
        const result = await toggleUserStatusAction(user.id, user.isActive);
        if (!result.ok) {
          alert(result.message);
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-semibold text-primary/80">Daftar Pengguna</h3>
        <Button onClick={handleAdd}>
          <PlusIcon data-icon="inline-start" />
          Tambah Pengguna
        </Button>
      </div>

      <div className="rounded-xl border border-border/70 bg-background/80 p-0 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Unit / Wilayah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className={user.isActive ? "" : "opacity-60 grayscale-[0.5]"}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    {user.username}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{user.namaLengkap}</span>
                    <span className="text-xs text-muted-foreground">{user.nipp || "-"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal border-primary/20 bg-primary/5 text-primary">
                    {formatRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{user.unit}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {user.entityName || "Rail Clinic"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={user.isActive ? "status-safe" : "bg-muted text-muted-foreground"}>
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <EditIcon className="mr-2 size-4" />
                        Edit Data
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(user)}
                        className={user.isActive ? "text-destructive" : "text-emerald-600"}
                        disabled={isPending}
                      >
                        {user.isActive ? (
                          <>
                            <UserMinusIcon className="mr-2 size-4" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <UserCheckIcon className="mr-2 size-4" />
                            Aktifkan
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selectedUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}</SheetTitle>
            <SheetDescription>
              {selectedUser 
                ? "Perbarui informasi profil dan hak akses pengguna." 
                : "Daftarkan pengguna baru ke dalam sistem RCIS."}
            </SheetDescription>
          </SheetHeader>
          <UserForm 
            user={selectedUser} 
            roles={roles} 
            entities={entities} 
            onSuccess={() => setIsSheetOpen(false)} 
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}