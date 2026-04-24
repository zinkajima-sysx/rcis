'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { assertModuleAccess } from '@/lib/auth';
import { buildEntitasHakAkses } from '@/lib/permissions';
import { getNextBusinessId } from '@/lib/business-ids';
import { db } from '@/lib/db';
import { expectRow } from '@/lib/db/rows';
import { entitas } from '@/lib/db/schema';

export async function getEntitasList() {
  try {
    await assertModuleAccess('Entitas', 'r');
    const data = await db.query.entitas.findMany({
      orderBy: (entitas, { asc }) => [asc(entitas.createdAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createEntitas(formData: FormData) {
  try {
    await assertModuleAccess('Entitas', 'c');
    const nama = formData.get('entitas') as string;
    const existingEntitas = await db.query.entitas.findMany({
      columns: { id: true, kode: true },
    });
    const kode = getNextBusinessId(
      existingEntitas.flatMap((item) => [item.id, item.kode]),
      'ENT',
      2,
    );

    const [newEntitasRow] = await db.insert(entitas).values({
      id: kode,
      kode,
      nama,
      hakAkses: buildEntitasHakAkses(nama),
    }).returning();
    const newEntitas = expectRow(newEntitasRow, 'Entitas gagal dibuat.');

    revalidatePath('/master/entitas');
    return { success: true, data: newEntitas };
  } catch (error: any) {
    return { success: false, error: 'Gagal membuat data entitas: ' + error.message };
  }
}

export async function updateEntitas(id: string, formData: FormData) {
  try {
    await assertModuleAccess('Entitas', 'u');
    const nama = formData.get('entitas') as string;
    
    const [updatedRow] = await db.update(entitas).set({
      nama,
      updatedAt: new Date(),
    }).where(eq(entitas.id, id)).returning();
    const updated = expectRow(updatedRow, 'Entitas tidak ditemukan.');

    revalidatePath('/master/entitas');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: 'Gagal mengubah data entitas: ' + error.message };
  }
}

export async function deleteEntitas(id: string) {
  try {
    await assertModuleAccess('Entitas', 'd');
    await db.delete(entitas).where(eq(entitas.id, id));
    
    revalidatePath('/master/entitas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus entitas. Pastikan tidak ada data yang terikat (User).' };
  }
}
