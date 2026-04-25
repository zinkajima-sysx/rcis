import React from 'react';
import { getUserHakAkses, requireModuleAccess } from '@/lib/auth';
import { formatDateForInputIndonesia } from '@/lib/date-id';
import { db } from '@/lib/db';
import AlkesClient from './AlkesClient';

export const dynamic = 'force-dynamic';

export default async function AlkesPage() {
  const currentUser = await requireModuleAccess('Alkes', 'r');
  const permissions = getUserHakAkses(currentUser).Alkes;
  const alkesList = await db.query.alkes.findMany({
    with: { kategori: true },
    orderBy: (alkes, { desc }) => [desc(alkes.createdAt)],
  });

  // Flatten output so client component receives a simple display shape
  const mappedData = alkesList.map(a => ({
     id: a.id,
     kode: a.kode,
     nama: a.nama,
     jumlah: a.jumlah,
     kategori: a.kategori?.nama || 'Umum',
     tahunPengadaan: a.tahunPengadaan,
     kalibrasiTerakhir: formatDateForInputIndonesia(a.kalibrasiTerakhir),
     jadwalKalibrasi: formatDateForInputIndonesia(a.jadwalKalibrasi),
     calibrationMode: a.kalibrasiTerakhir || a.jadwalKalibrasi ? 'required' : 'none',
     kondisi: a.kondisi,
     gambarUrl: a.gambarUrl,
     keterangan: a.keterangan,
  }));

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Inventaris Alat Kesehatan</h1>
          <p className="text-slate-400 text-sm mt-1">Kelola data alat kesehatan, kelayakan, dan jadwal kalibrasi.</p>
        </div>
      </header>

      <AlkesClient initialData={mappedData} permissions={permissions} />
    </main>
  );
}
