'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { assertModuleAccess } from '@/lib/auth';
import { getNextBusinessId } from '@/lib/business-ids';
import { db } from '@/lib/db';
import { isUniqueViolation } from '@/lib/db/errors';
import { expectRow } from '@/lib/db/rows';
import { kategoriAlkes } from '@/lib/db/schema';

function getUniqueError(error: any) {
  if (isUniqueViolation(error)) {
    return 'Nama kategori sudah ada.';
  }

  return null;
}

export async function createKategori(formData: FormData) {
  try {
    await assertModuleAccess('KategoriAlkes', 'c');
    const nama = String(formData.get('nama') ?? '').trim();

    if (!nama) {
      return { success: false, error: 'Nama kategori wajib diisi.' };
    }

    const existingKategori = await db.query.kategoriAlkes.findMany({
      columns: { id: true },
    });
    const id = getNextBusinessId(
      existingKategori.map((item) => item.id),
      'AK',
      2,
    );

    const [createdRow] = await db.insert(kategoriAlkes).values({ id, nama }).returning();
    const created = expectRow(createdRow, 'Kategori gagal dibuat.');

    revalidatePath('/master/kategori');
    revalidatePath('/alkes');
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: getUniqueError(error) ?? `Gagal menambah kategori: ${error.message}` };
  }
}

export async function updateKategori(id: string, formData: FormData) {
  try {
    await assertModuleAccess('KategoriAlkes', 'u');
    const nama = String(formData.get('nama') ?? '').trim();

    if (!nama) {
      return { success: false, error: 'Nama kategori wajib diisi.' };
    }

    const [updatedRow] = await db.update(kategoriAlkes).set({
      nama,
      updatedAt: new Date(),
    }).where(eq(kategoriAlkes.id, id)).returning();
    const updated = expectRow(updatedRow, 'Kategori tidak ditemukan.');

    revalidatePath('/master/kategori');
    revalidatePath('/alkes');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: getUniqueError(error) ?? `Gagal mengubah kategori: ${error.message}` };
  }
}

export async function deleteKategori(id: string) {
  try {
    await assertModuleAccess('KategoriAlkes', 'd');
    await db.delete(kategoriAlkes).where(eq(kategoriAlkes.id, id));

    revalidatePath('/master/kategori');
    revalidatePath('/alkes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus kategori. Pastikan tidak ada data alkes yang masih memakai kategori ini.' };
  }
}
