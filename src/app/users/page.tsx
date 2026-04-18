import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";

import { UserManagement } from "@/components/user-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsers, getRoles, getEntities } from "@/lib/rci-data";

export const metadata: Metadata = {
  title: "Manajemen Pengguna",
};

export default async function UsersPage() {
  const users = await getUsers();
  const roles = await getRoles();
  const entities = await getEntities();

  return (
    <div className="flex flex-col gap-6">
      <Card className="surface-panel border-white/70 shadow-lg shadow-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="status-safe border-transparent">
              {users.length} pengguna terdaftar
            </Badge>
          </div>
          <CardTitle className="text-3xl font-heading">Manajemen Pengguna</CardTitle>
          <CardDescription>
            Kelola hak akses dan profil pengguna sistem Rail Clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end">
            <Button>
              <PlusIcon data-icon="inline-start" />
              Tambah User
            </Button>
          </div>
        </CardContent>
      </Card>

      <UserManagement users={users} roles={roles} entities={entities} />
    </div>
  );
}