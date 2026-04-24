import React from 'react';
import { getUserHakAkses, requireModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';
import HandoverClient from './HandoverClient';
import { mapHandoverRecord } from './handover-view';

export const dynamic = 'force-dynamic';

export default async function HandoverPage() {
  const currentUser = await requireModuleAccess('Handover', 'r');
  const permissions = getUserHakAkses(currentUser).Handover;
  const [handoverData, daopOptions, userOptions] = await Promise.all([
    db.query.handover.findMany({
      with: {
        daopAsal: {
          columns: {
            id: true,
            nama: true,
          },
        },
        daopKe: {
          columns: {
            id: true,
            nama: true,
          },
        },
        createdByUser: {
          columns: {
            id: true,
            nama: true,
            nip: true,
          },
        },
      },
      orderBy: (handover, { desc }) => [desc(handover.createdAt)],
    }),
    db.query.daop.findMany({
      columns: {
        id: true,
        nama: true,
      },
      orderBy: (daop, { asc }) => [asc(daop.nama)],
    }),
    db.query.users.findMany({
      columns: {
        id: true,
        nip: true,
        nama: true,
      },
      orderBy: (users, { asc }) => [asc(users.nama)],
    }),
  ]);

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Handover Alkes</h1>
          <p className="text-slate-400 text-sm mt-1">Manajemen serah terima alat kesehatan antar kegiatan.</p>
        </div>
      </header>

      <HandoverClient
        initialData={handoverData.map(mapHandoverRecord)}
        daopOptions={daopOptions}
        userOptions={userOptions}
        permissions={permissions}
      />
    </main>
  );
}
