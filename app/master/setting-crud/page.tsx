import React from 'react';

import { requireModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';
import { normalizeHakAkses } from '@/lib/permissions';

import SettingCrudClient from './SettingCrudClient';

export const dynamic = 'force-dynamic';

export default async function SettingCrudPage() {
  await requireModuleAccess('SettingCRUD', 'r');
  const entitasList = await db.query.entitas.findMany({
    orderBy: (entitas, { asc }) => [asc(entitas.createdAt)],
  });

  const initialData = entitasList.map((item) => ({
    id: item.id,
    kode: item.kode,
    entitas: item.nama,
    hak_akses: normalizeHakAkses(item.hakAkses),
  }));

  return <SettingCrudClient initialData={initialData} />;
}
