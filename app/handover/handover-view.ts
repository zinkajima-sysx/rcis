import { formatDateForInputIndonesia } from '@/lib/date-id';

type HandoverRelationSnapshot = {
  id: string;
  kode: string;
  judul: string;
  tanggal: Date;
  pemberi: string;
  pemberiNipp: string | null;
  penerima: string;
  penerimaNipp: string | null;
  keterangan: string | null;
  images: string[] | null;
  namaKegiatanDari: string | null;
  tanggalKegiatanAsal: Date | null;
  wilayahDaopAsal: string | null;
  namaKegiatanKe: string | null;
  tanggalKegiatanKe: Date | null;
  wilayahDaopKe: string | null;
  lokasiStasiun: string | null;
  nippPenyerah: string | null;
  namaPenyerah: string | null;
  nippPenerima: string | null;
  namaPenerima: string | null;
  tanggalSerahTerima: Date | null;
  fotoSerahTerima: string | null;
  fotoBukti: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  daopAsal?: { id: string; nama: string } | null;
  daopKe?: { id: string; nama: string } | null;
  createdByUser?: { id: string; nama: string; nip: string } | null;
};

function addOneDay(value: Date) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate;
}

export function mapHandoverRecord(row: HandoverRelationSnapshot) {
  const fallbackAsalDate = row.tanggalKegiatanAsal ?? row.tanggal;
  const fallbackKeDate = row.tanggalKegiatanKe ?? addOneDay(row.tanggal);
  const fallbackSerahTerimaDate = row.tanggalSerahTerima ?? row.tanggal;
  const images = row.images ?? [];

  return {
    id: row.id,
    kode: row.kode,
    namaKegiatanDari: row.namaKegiatanDari ?? row.judul,
    tanggalKegiatanAsal: formatDateForInputIndonesia(fallbackAsalDate),
    wilayahDaopAsal: row.wilayahDaopAsal ?? '',
    wilayahDaopAsalNama: row.daopAsal?.nama ?? '-',
    namaKegiatanKe: row.namaKegiatanKe ?? row.judul,
    tanggalKegiatanKe: formatDateForInputIndonesia(fallbackKeDate),
    wilayahDaopKe: row.wilayahDaopKe ?? '',
    wilayahDaopKeNama: row.daopKe?.nama ?? '-',
    lokasiStasiun: row.lokasiStasiun ?? '',
    keterangan: row.keterangan ?? '',
    nippPenyerah: row.nippPenyerah ?? row.pemberiNipp ?? '',
    namaPenyerah: row.namaPenyerah ?? row.pemberi ?? '',
    nippPenerima: row.nippPenerima ?? row.penerimaNipp ?? '',
    namaPenerima: row.namaPenerima ?? row.penerima ?? '',
    tanggalSerahTerima: formatDateForInputIndonesia(fallbackSerahTerimaDate),
    fotoSerahTerima: row.fotoSerahTerima ?? images[0] ?? '',
    fotoBukti: row.fotoBukti ?? images[1] ?? '',
    createdBy: row.createdBy ?? '',
    createdByNama: row.createdByUser?.nama ?? '',
    createdByNipp: row.createdByUser?.nip ?? '',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    legacyJudul: row.judul,
    legacyTanggal: row.tanggal.toISOString(),
  };
}

export type HandoverViewItem = ReturnType<typeof mapHandoverRecord>;
