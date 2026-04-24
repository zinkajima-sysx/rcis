'use server';

import { getNextBusinessId } from '@/lib/business-ids';
import { assertModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';
import { expectRow } from '@/lib/db/rows';
import { galeri } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createGaleri(formData: FormData) {
  try {
    await assertModuleAccess('Galeri', 'c');
    const namaKegiatan = formData.get('namaKegiatan') as string;
    const tanggal = new Date(formData.get('tanggal') as string);
    const daop = formData.get('daop') as string;
    const lokasi = formData.get('lokasi') as string;
    const keterangan = formData.get('keterangan') as string;
    
    // In a real app we'd get image URLs from the client after cloudinary upload
    // Exact image URLs passed directly from Cloudinary after client-side upload
    const img1 = formData.get('img1') as string || '';
    const img2 = formData.get('img2') as string || '';

    const existingGaleri = await db.query.galeri.findMany({
      columns: { id: true, kode: true },
    });
    const kode = getNextBusinessId(
      existingGaleri.flatMap((item) => [item.id, item.kode]),
      'RC',
      6,
    );

    const [newGaleriRow] = await db.insert(galeri).values({
      id: kode,
      kode,
      namaKegiatan,
      tanggal,
      daop,
      lokasi,
      keterangan,
      images: [img1, img2].filter(Boolean),
    }).returning();
    const newGaleri = expectRow(newGaleriRow, 'Galeri gagal dibuat.');

    revalidatePath('/galeri');
    return { success: true, data: newGaleri };
  } catch (error: any) {
    return { success: false, error: 'Gagal menambah galeri: ' + error.message };
  }
}

export async function updateGaleri(id: string, formData: FormData) {
  try {
    await assertModuleAccess('Galeri', 'u');
    const namaKegiatan = formData.get('namaKegiatan') as string;
    const tanggal = new Date(formData.get('tanggal') as string);
    const daop = formData.get('daop') as string;
    const lokasi = formData.get('lokasi') as string;
    const keterangan = formData.get('keterangan') as string;
    const img1 = formData.get('img1') as string || '';
    const img2 = formData.get('img2') as string || '';

    const [updatedGaleriRow] = await db.update(galeri).set({
      namaKegiatan,
      tanggal,
      daop,
      lokasi,
      keterangan,
      images: [img1, img2].filter(Boolean),
      updatedAt: new Date(),
    }).where(eq(galeri.id, id)).returning();
    const updatedGaleri = expectRow(updatedGaleriRow, 'Galeri tidak ditemukan.');

    revalidatePath('/galeri');
    return { success: true, data: updatedGaleri };
  } catch (error: any) {
    return { success: false, error: 'Gagal mengubah galeri: ' + error.message };
  }
}

export async function deleteGaleri(id: string) {
  try {
    await assertModuleAccess('Galeri', 'd');
    await db.delete(galeri).where(eq(galeri.id, id));
    
    revalidatePath('/galeri');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus kegiatan ini.' };
  }
}
