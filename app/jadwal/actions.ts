'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { getNextBusinessId } from '@/lib/business-ids';
import { assertModuleAccess } from '@/lib/auth';
import { db } from '@/lib/db';
import { expectRow } from '@/lib/db/rows';
import { jadwalRC } from '@/lib/db/schema';

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

async function getNextJadwalKode() {
  const items = await db.query.jadwalRC.findMany({
    columns: { id: true, kode: true },
  });

  return {
    id: getNextBusinessId(
      items.flatMap((item) => [item.id, item.kode?.replace('RC-', 'JRC-')]),
      'JRC',
      6,
    ),
    kode: getNextBusinessId(
      items.map((item) => item.kode),
      'RC',
      6,
    ),
  };
}

function validatePayload(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  const daop = String(formData.get('daop') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  if (!title || !date || !location || !daop || !status) {
    return { error: 'Tema kegiatan, tanggal, lokasi, wilayah, dan status wajib diisi.' };
  }

  return { title, date, location, daop, status };
}

function mapJadwal(item: any) {
  return {
    id: item.id,
    kode: item.kode,
    title: item.title,
    date: new Date(item.date).toISOString().split('T')[0],
    location: item.location,
    daop: item.daop,
    status: item.status,
  };
}

export async function createJadwal(formData: FormData) {
  try {
    await assertModuleAccess('JadwalRC', 'c');
    const payload = validatePayload(formData);

    if ('error' in payload) {
      return { success: false, error: payload.error };
    }

    const nextIdentifier = await getNextJadwalKode();
    const [createdRow] = await db.insert(jadwalRC).values({
      id: nextIdentifier.id,
      kode: nextIdentifier.kode,
      title: payload.title,
      date: parseDateOnly(payload.date),
      location: payload.location,
      daop: payload.daop,
      status: payload.status,
    }).returning();
    const created = expectRow(createdRow, 'Jadwal gagal dibuat.');

    revalidatePath('/jadwal');
    revalidatePath('/galeri');
    return { success: true, data: mapJadwal(created) };
  } catch (error: any) {
    return { success: false, error: `Gagal membuat jadwal: ${error.message}` };
  }
}

export async function updateJadwal(id: string, formData: FormData) {
  try {
    await assertModuleAccess('JadwalRC', 'u');
    const payload = validatePayload(formData);

    if ('error' in payload) {
      return { success: false, error: payload.error };
    }

    const [updatedRow] = await db.update(jadwalRC).set({
      title: payload.title,
      date: parseDateOnly(payload.date),
      location: payload.location,
      daop: payload.daop,
      status: payload.status,
      updatedAt: new Date(),
    }).where(eq(jadwalRC.id, id)).returning();
    const updated = expectRow(updatedRow, 'Jadwal tidak ditemukan.');

    revalidatePath('/jadwal');
    revalidatePath('/galeri');
    return { success: true, data: mapJadwal(updated) };
  } catch (error: any) {
    return { success: false, error: `Gagal mengubah jadwal: ${error.message}` };
  }
}

export async function deleteJadwal(id: string) {
  try {
    await assertModuleAccess('JadwalRC', 'd');
    await db.delete(jadwalRC).where(eq(jadwalRC.id, id));

    revalidatePath('/jadwal');
    revalidatePath('/galeri');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Gagal menghapus jadwal: ${error.message}` };
  }
}
