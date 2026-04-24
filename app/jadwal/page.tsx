import React from 'react';

import { getUserHakAkses, requireModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';

import JadwalClient from './JadwalClient';

export const dynamic = 'force-dynamic';

export default async function JadwalPage() {
  const currentUser = await requireModuleAccess('JadwalRC', 'r');
  const permissions = getUserHakAkses(currentUser).JadwalRC;
  const [jadwalList, daopList] = await Promise.all([
    db.query.jadwalRC.findMany({
      orderBy: (jadwalRC, { asc }) => [asc(jadwalRC.date), asc(jadwalRC.createdAt)],
    }),
    db.query.daop.findMany({
      columns: { nama: true },
      orderBy: (daop, { asc }) => [asc(daop.nama)],
    }),
  ]);

  const mappedEvents = jadwalList.map((item) => ({
    id: item.id,
    kode: item.kode,
    title: item.title,
    date: item.date.toISOString().split('T')[0],
    location: item.location,
    daop: item.daop,
    status: item.status,
  }));

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <JadwalClient initialEvents={mappedEvents} daopList={daopList.map((item) => item.nama)} permissions={permissions} />
    </main>
  );
}
