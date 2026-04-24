'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { assertModuleAccess } from '@/lib/auth';
import { getNextNumericTextId } from '@/lib/business-ids';
import { db } from '@/lib/db';
import { isUniqueViolation } from '@/lib/db/errors';
import { expectRow } from '@/lib/db/rows';
import { daop } from '@/lib/db/schema';

function getUniqueError(error: any) {
  if (isUniqueViolation(error)) {
    return 'Nama Daop / Divre sudah ada.';
  }

  return null;
}

export async function createDaop(formData: FormData) {
  try {
    await assertModuleAccess('DaopDivre', 'c');
    const nama = String(formData.get('nama') ?? '').trim();

    if (!nama) {
      return { success: false, error: 'Nama Daop / Divre wajib diisi.' };
    }

    const existingDaop = await db.query.daop.findMany({
      columns: { id: true },
    });
    const id = getNextNumericTextId(existingDaop.map((item) => item.id));

    const [createdRow] = await db.insert(daop).values({ id, nama }).returning();
    const created = expectRow(createdRow, 'Daop / Divre gagal dibuat.');

    revalidatePath('/master/daop');
    revalidatePath('/galeri');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: getUniqueError(error) ?? `Gagal menambah Daop / Divre: ${error.message}` };
  }
}

export async function updateDaop(id: string, formData: FormData) {
  try {
    await assertModuleAccess('DaopDivre', 'u');
    const nama = String(formData.get('nama') ?? '').trim();

    if (!nama) {
      return { success: false, error: 'Nama Daop / Divre wajib diisi.' };
    }

    const [updatedRow] = await db.update(daop).set({
      nama,
      updatedAt: new Date(),
    }).where(eq(daop.id, id)).returning();
    const updated = expectRow(updatedRow, 'Daop / Divre tidak ditemukan.');

    revalidatePath('/master/daop');
    revalidatePath('/galeri');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: getUniqueError(error) ?? `Gagal mengubah Daop / Divre: ${error.message}` };
  }
}

export async function deleteDaop(id: string) {
  try {
    await assertModuleAccess('DaopDivre', 'd');
    await db.delete(daop).where(eq(daop.id, id));

    revalidatePath('/master/daop');
    revalidatePath('/galeri');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus Daop / Divre. Pastikan tidak ada user yang masih terhubung.' };
  }
}
