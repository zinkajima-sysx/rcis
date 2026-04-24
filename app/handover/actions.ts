'use server';

import { getNextBusinessId } from '@/lib/business-ids';
import { assertModuleAccess, getUser } from '@/lib/auth';
import { parseIndonesianDate } from '@/lib/date-id';
import { db } from '@/lib/db';
import { expectRow } from '@/lib/db/rows';
import { handover } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { mapHandoverRecord } from './handover-view';

function getRequiredValue(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? '').trim();

  if (!value) {
    throw new Error(`${label} wajib diisi.`);
  }

  return value;
}

function parseRequiredDate(formData: FormData, key: string, label: string) {
  const value = getRequiredValue(formData, key, label);
  const parsedDate = parseIndonesianDate(value);

  if (!parsedDate) {
    throw new Error(`${label} wajib diisi dengan format DD/MM/YYYY.`);
  }

  return parsedDate;
}

async function resolveDaop(id: string, label: string) {
  const item = await db.query.daop.findFirst({
    columns: {
      id: true,
      nama: true,
    },
    where: (daop, { eq }) => eq(daop.id, id),
  });

  if (!item) {
    throw new Error(`${label} tidak ditemukan di referensi wilayah DAOP/DIVRE.`);
  }

  return item;
}

async function resolveUserByNipp(nip: string, label: string) {
  const item = await db.query.users.findFirst({
    columns: {
      id: true,
      nip: true,
      nama: true,
    },
    where: (users, { eq }) => eq(users.nip, nip),
  });

  if (!item) {
    throw new Error(`${label} tidak ditemukan pada data user.`);
  }

  return item;
}

async function loadMappedHandover(id: string) {
  const handoverRecord = await db.query.handover.findFirst({
    with: {
      daopAsal: {
        columns: {
          id: true,
          nama: true,
        },
      },
      daopKe: {
        columns: {
          id: true,
          nama: true,
        },
      },
      createdByUser: {
        columns: {
          id: true,
          nama: true,
          nip: true,
        },
      },
    },
    where: (handover, { eq }) => eq(handover.id, id),
  });

  return handoverRecord ? mapHandoverRecord(handoverRecord) : null;
}

async function parseHandoverPayload(formData: FormData) {
  const namaKegiatanDari = getRequiredValue(formData, 'namaKegiatanDari', 'Nama kegiatan dari');
  const tanggalKegiatanAsal = parseRequiredDate(formData, 'tanggalKegiatanAsal', 'Tanggal kegiatan asal');
  const wilayahDaopAsal = getRequiredValue(formData, 'wilayahDaopAsal', 'Wilayah DAOP asal');
  const namaKegiatanKe = getRequiredValue(formData, 'namaKegiatanKe', 'Nama kegiatan ke');
  const tanggalKegiatanKe = parseRequiredDate(formData, 'tanggalKegiatanKe', 'Tanggal kegiatan ke');
  const wilayahDaopKe = getRequiredValue(formData, 'wilayahDaopKe', 'Wilayah DAOP tujuan');
  const lokasiStasiun = getRequiredValue(formData, 'lokasiStasiun', 'Lokasi stasiun');
  const keterangan = String(formData.get('keterangan') ?? '').trim();
  const nippPenyerah = getRequiredValue(formData, 'nippPenyerah', 'NIPP penyerah');
  const nippPenerima = getRequiredValue(formData, 'nippPenerima', 'NIPP penerima');
  const tanggalSerahTerimaRaw = String(formData.get('tanggalSerahTerima') ?? '').trim();
  const tanggalSerahTerima = tanggalSerahTerimaRaw
    ? parseIndonesianDate(tanggalSerahTerimaRaw)
    : new Date(new Date().setHours(0, 0, 0, 0));
  const fotoSerahTerima = String(formData.get('fotoSerahTerima') ?? '').trim();
  const fotoBukti = String(formData.get('fotoBukti') ?? '').trim();

  if (!tanggalSerahTerima) {
    throw new Error('Tanggal serah terima wajib diisi dengan format DD/MM/YYYY.');
  }

  if (tanggalKegiatanAsal.getTime() === tanggalKegiatanKe.getTime()) {
    throw new Error('Tanggal kegiatan ke tidak boleh sama dengan tanggal kegiatan asal.');
  }

  const [daopAsal, daopKe, penyerahUser, penerimaUser, currentUser] = await Promise.all([
    resolveDaop(wilayahDaopAsal, 'Wilayah DAOP asal'),
    resolveDaop(wilayahDaopKe, 'Wilayah DAOP tujuan'),
    resolveUserByNipp(nippPenyerah, 'Penyerah'),
    resolveUserByNipp(nippPenerima, 'Penerima'),
    getUser(),
  ]);

  if (!fotoSerahTerima) {
    throw new Error('Foto serah terima wajib diunggah.');
  }

  if (!fotoBukti) {
    throw new Error('Foto bukti checklist wajib diunggah.');
  }

  return {
    judul: `${namaKegiatanDari} -> ${namaKegiatanKe}`,
    tanggal: tanggalSerahTerima,
    pemberi: penyerahUser.nama,
    pemberiNipp: penyerahUser.nip,
    penerima: penerimaUser.nama,
    penerimaNipp: penerimaUser.nip,
    keterangan,
    images: [fotoSerahTerima, fotoBukti],
    namaKegiatanDari,
    tanggalKegiatanAsal,
    wilayahDaopAsal: daopAsal.id,
    namaKegiatanKe,
    tanggalKegiatanKe,
    wilayahDaopKe: daopKe.id,
    lokasiStasiun,
    nippPenyerah: penyerahUser.nip,
    namaPenyerah: penyerahUser.nama,
    nippPenerima: penerimaUser.nip,
    namaPenerima: penerimaUser.nama,
    tanggalSerahTerima,
    fotoSerahTerima,
    fotoBukti,
    createdBy: currentUser?.userId ?? null,
  };
}

export async function createHandover(formData: FormData) {
  try {
    await assertModuleAccess('Handover', 'c');
    const payload = await parseHandoverPayload(formData);

    const existingHandover = await db.query.handover.findMany({
      columns: { id: true, kode: true },
    });
    const id = getNextBusinessId(
      existingHandover.flatMap((item) => [item.id, item.kode?.replace('BAST-', 'ST-')]),
      'ST',
      6,
    );
    const kode = getNextBusinessId(
      existingHandover.map((item) => item.kode),
      'BAST',
      6,
    );

    const [newHandoverRow] = await db.insert(handover).values({
      id,
      kode,
      ...payload,
    }).returning();
    const newHandover = expectRow(newHandoverRow, 'Handover gagal dibuat.');
    const mappedHandover = await loadMappedHandover(newHandover.id);

    revalidatePath('/handover');
    return { success: true, data: mappedHandover ?? mapHandoverRecord({ ...newHandover, daopAsal: null, daopKe: null, createdByUser: null }) };
  } catch (error: any) {
    return { success: false, error: 'Gagal menambah serah terima: ' + error.message };
  }
}

export async function updateHandover(id: string, formData: FormData) {
  try {
    await assertModuleAccess('Handover', 'u');
    const payload = await parseHandoverPayload(formData);

    const [updatedHandoverRow] = await db.update(handover).set({
      ...payload,
      updatedAt: new Date(),
    }).where(eq(handover.id, id)).returning();
    const updatedHandover = expectRow(updatedHandoverRow, 'Handover tidak ditemukan.');
    const mappedHandover = await loadMappedHandover(updatedHandover.id);

    revalidatePath('/handover');
    return { success: true, data: mappedHandover ?? mapHandoverRecord({ ...updatedHandover, daopAsal: null, daopKe: null, createdByUser: null }) };
  } catch (error: any) {
    return { success: false, error: 'Gagal mengubah serah terima: ' + error.message };
  }
}

export async function deleteHandover(id: string) {
  try {
    await assertModuleAccess('Handover', 'd');
    await db.delete(handover).where(eq(handover.id, id));
    
    revalidatePath('/handover');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus serah terima ini.' };
  }
}
