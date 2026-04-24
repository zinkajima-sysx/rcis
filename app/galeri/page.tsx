import React from 'react';
import { db } from '@/lib/db';
import { getUserHakAkses, requireModuleAccess } from '@/lib/auth';
import GaleriClient from './GaleriClient';

export const dynamic = 'force-dynamic';

export default async function GaleriPage() {
  const currentUser = await requireModuleAccess('Galeri', 'r');
  const permissions = getUserHakAkses(currentUser).Galeri;
  const galeriData = await db.query.galeri.findMany({
    orderBy: (galeri, { desc }) => [desc(galeri.createdAt)],
  });

  const daopList = await db.query.daop.findMany({
    orderBy: (daop, { asc }) => [asc(daop.nama)],
  });

  const jadwalSelesai = await db.query.jadwalRC.findMany({
    where: (jadwalRC, { eq }) => eq(jadwalRC.status, 'Selesai'),
    orderBy: (jadwalRC, { desc }) => [desc(jadwalRC.date)],
  });

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Galeri Kegiatan Baksos</h1>
          <p className="text-slate-400 text-sm mt-1">Arsip dokumentasi kegiatan bakti sosial Rail Clinic.</p>
        </div>
      </header>

      <GaleriClient 
        initialData={galeriData} 
        daopList={daopList}
        jadwalSelesai={jadwalSelesai}
        permissions={permissions}
      />
    </main>
  );
}
