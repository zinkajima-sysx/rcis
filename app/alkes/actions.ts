'use server';

import { getNextBusinessId } from '@/lib/business-ids';
import { assertModuleAccess } from '@/lib/auth';
import { parseDateInput } from '@/lib/date-id';
import { db } from '@/lib/db';
import { expectRow } from '@/lib/db/rows';
import { alkes, kategoriAlkes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function parseTahunPengadaan(rawValue: FormDataEntryValue | null) {
  const value = String(rawValue ?? '').trim();

  if (!/^\d{4}$/.test(value)) {
    throw new Error('Tahun pengadaan wajib diisi dengan format YYYY.');
  }

  const year = Number.parseInt(value, 10);
  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear) {
    throw new Error(`Tahun pengadaan harus berada di antara 1900 dan ${currentYear}.`);
  }

  return year;
}

function parseJumlah(rawValue: FormDataEntryValue | null) {
  const value = String(rawValue ?? '').trim();

  if (!/^\d+$/.test(value)) {
    throw new Error('Jumlah wajib diisi angka bulat.');
  }

  const jumlah = Number.parseInt(value, 10);

  if (jumlah < 0) {
    throw new Error('Jumlah tidak boleh negatif.');
  }

  return jumlah;
}

function parseKalibrasiFields(formData: FormData) {
  const tahunPengadaan = parseTahunPengadaan(formData.get('tahunPengadaan'));
  const jumlah = parseJumlah(formData.get('jumlah'));
  const mode = String(formData.get('calibrationMode') ?? 'required').trim();
  const kalibrasiTerakhirRaw = String(formData.get('kalibrasiTerakhir') ?? '').trim();
  const jadwalKalibrasiRaw = String(formData.get('jadwalKalibrasi') ?? '').trim();

  if (mode === 'none') {
    return {
      jumlah,
      tahunPengadaan,
      kalibrasiTerakhir: null,
      jadwalKalibrasi: null,
    };
  }

  const kalibrasiTerakhir = parseDateInput(kalibrasiTerakhirRaw);
  const jadwalKalibrasi = parseDateInput(jadwalKalibrasiRaw);

  if (!kalibrasiTerakhir) {
    throw new Error('Kalibrasi terakhir wajib diisi dengan date picker.');
  }

  if (!jadwalKalibrasi) {
    throw new Error('Jadwal kalibrasi wajib diisi dengan date picker.');
  }

  if (jadwalKalibrasi.getTime() < kalibrasiTerakhir.getTime()) {
    throw new Error('Tanggal jadwal kalibrasi tidak boleh kurang dari kalibrasi terakhir.');
  }

  return {
    jumlah,
    tahunPengadaan,
    kalibrasiTerakhir,
    jadwalKalibrasi,
  };
}

export async function createAlkes(formData: FormData) {
  try {
    await assertModuleAccess('Alkes', 'c');
    const nama = formData.get('nama') as string;
    const kategoriNama = formData.get('kategori') as string || 'Umum';
    const kondisi = formData.get('kondisi') as string || 'Layak Pakai';
    const keterangan = formData.get('keterangan') as string || '';
    const imgUrl = formData.get('imgUrl') as string || '';
    const { jumlah, tahunPengadaan, kalibrasiTerakhir, jadwalKalibrasi } = parseKalibrasiFields(formData);

    // Pastikan kategori ada
    let kategori = await db.query.kategoriAlkes.findFirst({
      where: (kategoriAlkes, { eq }) => eq(kategoriAlkes.nama, kategoriNama),
    });
    
    if (!kategori) {
      const existingKategori = await db.query.kategoriAlkes.findMany({
        columns: { id: true },
      });
      const kategoriId = getNextBusinessId(
        existingKategori.map((item) => item.id),
        'AK',
        2,
      );
      const [kategoriRow] = await db.insert(kategoriAlkes).values({
        id: kategoriId,
        nama: kategoriNama,
      }).returning();
      kategori = expectRow(kategoriRow, 'Kategori alkes gagal dibuat.');
    }

    const existingAlkes = await db.query.alkes.findMany({
      columns: { id: true, kode: true },
    });
    const kode = getNextBusinessId(
      existingAlkes.flatMap((item) => [item.id, item.kode]),
      'AK',
      5,
    );

    const [newAlkesRow] = await db.insert(alkes).values({
      id: kode,
      kode,
      nama,
      kategoriId: kategori.id,
      tahunPengadaan,
      kalibrasiTerakhir,
      jadwalKalibrasi,
      kondisi,
      gambarUrl: imgUrl,
      keterangan,
      jumlah,
    }).returning();
    const newAlkes = expectRow(newAlkesRow, 'Alkes gagal dibuat.');

    revalidatePath('/alkes');
    return { success: true, data: { ...newAlkes, kategori: kategoriNama } };
  } catch (error: any) {
    return { success: false, error: 'Gagal menambah alat kesehatan: ' + error.message };
  }
}

export async function updateAlkes(id: string, formData: FormData) {
  try {
    await assertModuleAccess('Alkes', 'u');
    const nama = formData.get('nama') as string;
    const kategoriNama = formData.get('kategori') as string || 'Umum';
    const kondisi = formData.get('kondisi') as string || 'Layak Pakai';
    const keterangan = formData.get('keterangan') as string || '';
    const imgUrl = formData.get('imgUrl') as string || '';
    const { jumlah, tahunPengadaan, kalibrasiTerakhir, jadwalKalibrasi } = parseKalibrasiFields(formData);

    let kategori = await db.query.kategoriAlkes.findFirst({
      where: (kategoriAlkes, { eq }) => eq(kategoriAlkes.nama, kategoriNama),
    });

    if (!kategori) {
      const existingKategori = await db.query.kategoriAlkes.findMany({
        columns: { id: true },
      });
      const kategoriId = getNextBusinessId(
        existingKategori.map((item) => item.id),
        'AK',
        2,
      );
      const [kategoriRow] = await db.insert(kategoriAlkes).values({
        id: kategoriId,
        nama: kategoriNama,
      }).returning();
      kategori = expectRow(kategoriRow, 'Kategori alkes gagal dibuat.');
    }

    const [updatedAlkesRow] = await db.update(alkes).set({
      nama,
      jumlah,
      kategoriId: kategori.id,
      tahunPengadaan,
      kalibrasiTerakhir,
      jadwalKalibrasi,
      kondisi,
      gambarUrl: imgUrl,
      keterangan,
      updatedAt: new Date(),
    }).where(eq(alkes.id, id)).returning();
    const updatedAlkes = expectRow(updatedAlkesRow, 'Alkes tidak ditemukan.');

    revalidatePath('/alkes');
    return { success: true, data: { ...updatedAlkes, kategori: kategoriNama } };
  } catch (error: any) {
    return { success: false, error: 'Gagal mengubah alat kesehatan: ' + error.message };
  }
}

export async function deleteAlkes(id: string) {
  try {
    await assertModuleAccess('Alkes', 'd');
    await db.delete(alkes).where(eq(alkes.id, id));
    
    revalidatePath('/alkes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Gagal menghapus data alkes.' };
  }
}
