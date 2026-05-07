import React from 'react';
import { Tags } from 'lucide-react';

import { requireModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';

import KategoriClient from './KategoriClient';

export const dynamic = 'force-dynamic';

export default async function KategoriMasterPage() {
  await requireModuleAccess('KategoriAlkes', 'r');
  const data = await db.query.kategoriAlkes.findMany({
    columns: {
      id: true,
      nama: true,
    },
    orderBy: (kategoriAlkes, { asc }) => [asc(kategoriAlkes.nama)],
  });

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tags className="text-sky-400" /> Kategori Alkes
          </h1>
          <p className="text-slate-600 text-sm mt-1">Kelola klasifikasi dan jenis alat kesehatan langsung dari database.</p>
        </div>
      </header>

      <KategoriClient initialData={data} />
    </main>
  );
}
