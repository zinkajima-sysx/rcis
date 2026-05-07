import React from 'react';
import { Map } from 'lucide-react';

import { requireModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';

import DaopClient from './DaopClient';

export const dynamic = 'force-dynamic';

export default async function DaopMasterPage() {
  await requireModuleAccess('DaopDivre', 'r');
  const data = await db.query.daop.findMany({
    columns: {
      id: true,
      nama: true,
    },
    orderBy: (daop, { asc }) => [asc(daop.nama)],
  });

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Map className="text-sky-400" /> Data Daop / Divre
          </h1>
          <p className="text-slate-600 text-sm mt-1">Kelola daftar Daerah Operasi dan Divisi Regional PT KAI langsung dari database.</p>
        </div>
      </header>

      <DaopClient initialData={data} />
    </main>
  );
}
