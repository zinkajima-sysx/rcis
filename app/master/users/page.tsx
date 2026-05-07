import React from 'react';
import { Users } from 'lucide-react';

import { getUserHakAkses, requireModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';

import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersMasterPage() {
  const currentUser = await requireModuleAccess('ManajemenUser', 'r');
  const permissions = getUserHakAkses(currentUser).ManajemenUser;
  const isSuperadmin = String((currentUser.entitas as { nama?: string } | null)?.nama ?? '').trim().toLowerCase() === 'superadmin';
  const [users, entitasOptions, daopOptions] = await Promise.all([
    db.query.users.findMany({
      with: {
        entitas: true,
        daop: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    }),
    db.query.entitas.findMany({
      columns: { id: true, nama: true },
      orderBy: (entitas, { asc }) => [asc(entitas.createdAt)],
    }),
    db.query.daop.findMany({
      columns: { id: true, nama: true },
      orderBy: (daop, { asc }) => [asc(daop.nama)],
    }),
  ]);

  const visibleUsers = isSuperadmin ? users : users.filter((user) => user.entitas.nama.trim().toLowerCase() !== 'superadmin');

  const mappedUsers = visibleUsers.map((user) => ({
    id: user.id,
    nip: user.nip,
    nama: user.nama,
    entitasId: user.entitasId,
    entitasNama: user.entitas.nama,
    daopId: user.daopId ?? '',
    daopNama: user.daop?.nama ?? '-',
    berlakuSampai: user.berlakuSampai?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-sky-400" /> Manajemen User
          </h1>
          <p className="text-slate-600 text-sm mt-1">Kelola data pegawai, NIPP login, entitas, dan cakupan wilayah user langsung dari database.</p>
        </div>
      </header>

      <UsersClient
        initialData={mappedUsers}
        entitasOptions={isSuperadmin ? entitasOptions : entitasOptions.filter((item) => item.nama.trim().toLowerCase() !== 'superadmin')}
        daopOptions={daopOptions}
        permissions={permissions}
        isCurrentSuperadmin={isSuperadmin}
      />
    </main>
  );
}
