export type UserRole = "petugas_medis" | "manajemen" | "admin";

export type AppUser = {
  id: string;
  username: string;
  password: string;
  namaLengkap: string;
  role: UserRole;
  unit: string;
};

export type EquipmentCategory = {
  id: "alkes-elektromedis" | "alkes-non-elektromedis" | "perlengkapan-pendukung";
  nama: string;
};

export type PhotoTone = "ocean" | "ember" | "meadow" | "dusk";

export type ActivityPhoto = {
  id: string;
  judul: string;
  fokus: string;
  tone: PhotoTone;
  imageUrl: string;
};

export type MedicalEquipment = {
  id: string;
  kategoriId: EquipmentCategory["id"];
  namaAlat: string;
  merekTipe: string;
  tahunPengadaan: number;
  tglKalibrasiTerakhir: string;
  tglRencanaKalibrasi: string;
  statusKelayakan: "Layak Pakai" | "Butuh Perbaikan" | "Rusak / Tidak Layak";
  lokasiPenempatan: string;
  createdBy: string;
  visualTone: PhotoTone;
  keteranganKalibrasi: string;
  imageUrl: string;
};

export type RailClinicActivity = {
  id: string;
  namaKegiatan: string;
  tanggalKegiatan: string;
  lokasiStasiun: string;
  wilayahDaop: string;
  jumlahLayanan: number;
  keterangan: string;
  fotos: [ActivityPhoto, ActivityPhoto];
  createdBy: string;
};

export type HandoverPhoto = {
  id: string;
  judul: string;
  fokus: string;
  tone: PhotoTone;
  imageUrl: string;
};

export type HandoverRecord = {
  id: string;
  kegiatanAsal: string;
  kegiatanTujuan: string;
  tanggalSerahTerima: string;
  nippPenyerah: string;
  namaPenyerah: string;
  nippPenerima: string;
  namaPenerima: string;
  fotos: [HandoverPhoto, HandoverPhoto];
};

import { db } from '../db';
import * as schema from '../db/schema';

export type UserRole = "petugas_medis" | "manajemen" | "admin";
// ...existing code...
export const referenceDate = "2026-04-18";

export async function getCurrentUser() {
  const [user] = await db.select().from(schema.users).limit(1);
  return user ? {
    id: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: (user.roleLegacy || 'petugas_medis') as any,
  } : null;
}

export async function getUsers() {
  return await db.select().from(schema.users);
}

export async function getEquipmentCategories() {
  return await db.select().from(schema.equipmentCategories);
}

export async function getMedicalEquipments() {
  return await db.select({
    id: schema.medicalEquipment.id,
    kategoriId: schema.equipmentCategories.code,
    namaAlat: schema.medicalEquipment.name,
    merekTipe: schema.medicalEquipment.brandType,
    tahunPengadaan: schema.medicalEquipment.acquisitionYear,
    tglKalibrasiTerakhir: schema.medicalEquipment.lastCalibrationDate,
    tglRencanaKalibrasi: schema.medicalEquipment.nextCalibrationDate,
    statusKelayakan: schema.medicalEquipment.status,
    lokasiPenempatan: schema.medicalEquipment.location,
    createdBy: schema.medicalEquipment.createdBy,
    visualTone: schema.medicalEquipment.visualTone,
    keteranganKalibrasi: schema.medicalEquipment.calibrationNote,
    imageUrl: schema.medicalEquipment.imageUrl,
  })
  .from(schema.medicalEquipment)
  .leftJoin(schema.equipmentCategories, eq(schema.medicalEquipment.categoryId, schema.equipmentCategories.id));
}

export async function getRailClinicActivities() {
  const activities = await db.select().from(schema.railClinicActivities);
  
  const activitiesWithPhotos = await Promise.all(activities.map(async (act) => {
    const photos = await db.select().from(schema.activityPhotos).where(eq(schema.activityPhotos.activityId, act.id));
    return {
      ...act,
      fotos: photos as any,
    };
  }));
  
  return activitiesWithPhotos;
}

export async function getHandoverRecords() {
  const records = await db.select().from(schema.handovers);
  
  return await Promise.all(records.map(async (ho) => {
    const photos = await db.select().from(schema.handoverPhotos).where(eq(schema.handoverPhotos.handoverId, ho.id));
    return {
      ...ho,
      fotos: photos as any,
    };
  }));
}

// Keep mock data for fallback or legacy support if needed, but mark as deprecated
export const appUsers: AppUser[] = [
// ...existing code...
  {
    id: "USR-001",
    username: "mira.pratama",
    password: "railclinic123",
    namaLengkap: "Mira Pratama",
    role: "petugas_medis",
    unit: "Tim Medis Rail Clinic",
  },
  {
    id: "USR-002",
    username: "raka.manajemen",
    password: "railclinic123",
    namaLengkap: "Raka Maheswara",
    role: "manajemen",
    unit: "Manajemen Operasional",
  },
  {
    id: "USR-003",
    username: "admin.rci",
    password: "railclinic123",
    namaLengkap: "Admin Sistem RCI",
    role: "admin",
    unit: "Administrator Platform",
  },
];

export const equipmentCategories: EquipmentCategory[] = [
  { id: "alkes-elektromedis", nama: "Alkes elektromedis" },
  { id: "alkes-non-elektromedis", nama: "Alkes non elektromedis" },
  { id: "perlengkapan-pendukung", nama: "Perlengkapan pendukung" },
];

function commonsFilePath(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

export const medicalEquipments: MedicalEquipment[] = [
  {
    id: "ALK-001",
    kategoriId: "alkes-elektromedis",
    namaAlat: "Elektrokardiogram 12 Kanal",
    merekTipe: "Bionet CardioCare 2000",
    tahunPengadaan: 2022,
    tglKalibrasiTerakhir: "2025-05-15",
    tglRencanaKalibrasi: "2026-04-22",
    statusKelayakan: "Layak Pakai",
    lokasiPenempatan: "Gerbong pelayanan umum",
    createdBy: "USR-001",
    visualTone: "ocean",
    keteranganKalibrasi: "Kalibrasi tinggal 4 hari lagi.",
    imageUrl: commonsFilePath("An electrocardiograph Wellcome V0030859.jpg"),
  },
  {
    id: "ALK-002",
    kategoriId: "alkes-elektromedis",
    namaAlat: "USG 2D Portable",
    merekTipe: "Mindray DP-10",
    tahunPengadaan: 2021,
    tglKalibrasiTerakhir: "2025-04-03",
    tglRencanaKalibrasi: "2026-04-10",
    statusKelayakan: "Butuh Perbaikan",
    lokasiPenempatan: "Ruang pemeriksaan ibu dan anak",
    createdBy: "USR-001",
    visualTone: "ember",
    keteranganKalibrasi: "Sudah melewati jadwal kalibrasi 8 hari.",
    imageUrl: commonsFilePath("Ultrasound (1).jpg"),
  },
  {
    id: "ALK-003",
    kategoriId: "alkes-non-elektromedis",
    namaAlat: "Kursi Gigi",
    merekTipe: "Gnatus G4 + Serial 87A",
    tahunPengadaan: 2020,
    tglKalibrasiTerakhir: "2025-10-18",
    tglRencanaKalibrasi: "2026-10-18",
    statusKelayakan: "Layak Pakai",
    lokasiPenempatan: "Modul dental care",
    createdBy: "USR-001",
    visualTone: "meadow",
    keteranganKalibrasi: "Masih sesuai jadwal semester ini.",
    imageUrl: commonsFilePath("Dental chair in a dentist clinic.jpg"),
  },
  {
    id: "ALK-004",
    kategoriId: "alkes-elektromedis",
    namaAlat: "Nebulizer Compressor",
    merekTipe: "Omron NE-C28",
    tahunPengadaan: 2024,
    tglKalibrasiTerakhir: "2025-05-12",
    tglRencanaKalibrasi: "2026-05-12",
    statusKelayakan: "Layak Pakai",
    lokasiPenempatan: "Pos tindakan cepat",
    createdBy: "USR-001",
    visualTone: "ocean",
    keteranganKalibrasi: "Perlu persiapan vendor bulan depan.",
    imageUrl: commonsFilePath("Medical Nebulizer.jpg"),
  },
  {
    id: "ALK-005",
    kategoriId: "alkes-non-elektromedis",
    namaAlat: "Inkubator Bayi Portabel",
    merekTipe: "Phoenix Infant Care",
    tahunPengadaan: 2019,
    tglKalibrasiTerakhir: "2025-04-21",
    tglRencanaKalibrasi: "2026-04-20",
    statusKelayakan: "Butuh Perbaikan",
    lokasiPenempatan: "Unit rujukan neonatal",
    createdBy: "USR-001",
    visualTone: "dusk",
    keteranganKalibrasi: "Tinggal 2 hari dan butuh cek sensor suhu.",
    imageUrl: commonsFilePath("Incubator-baby.jpg"),
  },
  {
    id: "ALK-006",
    kategoriId: "perlengkapan-pendukung",
    namaAlat: "Lemari Pendingin Vaksin",
    merekTipe: "Meling BioSafe 110L",
    tahunPengadaan: 2023,
    tglKalibrasiTerakhir: "2025-07-30",
    tglRencanaKalibrasi: "2026-07-30",
    statusKelayakan: "Layak Pakai",
    lokasiPenempatan: "Cold chain gerbong farmasi",
    createdBy: "USR-001",
    visualTone: "dusk",
    keteranganKalibrasi: "Aman, monitoring suhu stabil.",
    imageUrl: commonsFilePath("VillageReach vaccine cold chain.jpg"),
  },
  {
    id: "ALK-007",
    kategoriId: "alkes-elektromedis",
    namaAlat: "Patient Monitor",
    merekTipe: "Comen C50",
    tahunPengadaan: 2022,
    tglKalibrasiTerakhir: "2025-03-28",
    tglRencanaKalibrasi: "2026-04-28",
    statusKelayakan: "Layak Pakai",
    lokasiPenempatan: "Bed observasi",
    createdBy: "USR-001",
    visualTone: "ocean",
    keteranganKalibrasi: "Perlu koordinasi vendor dalam 10 hari.",
    imageUrl: commonsFilePath("PatientMonitor-1.jpg"),
  },
  {
    id: "ALK-008",
    kategoriId: "alkes-non-elektromedis",
    namaAlat: "Timbangan Bayi Digital",
    merekTipe: "Seca 354",
    tahunPengadaan: 2023,
    tglKalibrasiTerakhir: "2025-04-05",
    tglRencanaKalibrasi: "2026-04-16",
    statusKelayakan: "Rusak / Tidak Layak",
    lokasiPenempatan: "Layanan tumbuh kembang",
    createdBy: "USR-001",
    visualTone: "ember",
    keteranganKalibrasi: "Sudah 2 hari lewat dan pembacaan tidak stabil.",
    imageUrl: commonsFilePath("Public baby weighing scale.JPG"),
  },
  {
    id: "ALK-009",
    kategoriId: "perlengkapan-pendukung",
    namaAlat: "Autoclave Table Top",
    merekTipe: "Runyes 18L",
    tahunPengadaan: 2020,
    tglKalibrasiTerakhir: "2025-08-11",
    tglRencanaKalibrasi: "2026-08-11",
    statusKelayakan: "Layak Pakai",
    lokasiPenempatan: "Sterilisasi instrumen",
    createdBy: "USR-001",
    visualTone: "meadow",
    keteranganKalibrasi: "Sterilisasi stabil, jadwal berikutnya aman.",
    imageUrl: commonsFilePath("Autoclave sterilization.jpg"),
  },
  {
    id: "ALK-010",
    kategoriId: "perlengkapan-pendukung",
    namaAlat: "Genset Cadangan Medis",
    merekTipe: "Yanmar Silent 12 kVA",
    tahunPengadaan: 2018,
    tglKalibrasiTerakhir: "2025-04-26",
    tglRencanaKalibrasi: "2026-04-26",
    statusKelayakan: "Butuh Perbaikan",
    lokasiPenempatan: "Kompartemen utilitas",
    createdBy: "USR-001",
    visualTone: "dusk",
    keteranganKalibrasi: "Tinggal 8 hari dan perlu servis starter.",
    imageUrl: commonsFilePath("Caterpillar (Olympian) Generator Set.jpg"),
  },
];

export const railClinicActivities: RailClinicActivity[] = [
  {
    id: "ACT-001",
    namaKegiatan: "Baksos Rail Clinic Generasi 4 di Stasiun Wates",
    tanggalKegiatan: "2026-03-12",
    lokasiStasiun: "Stasiun Wates",
    wilayahDaop: "Daop 6 Yogyakarta",
    jumlahLayanan: 214,
    keterangan:
      "Pelayanan pemeriksaan umum, gigi, ibu dan anak, serta edukasi pencegahan hipertensi untuk warga sekitar stasiun.",
    fotos: [
      {
        id: "ACT-001-A",
        judul: "Pemeriksaan kesehatan umum",
        fokus: "Antrean warga di area registrasi dan triase awal.",
        tone: "ocean",
        imageUrl: commonsFilePath("Health Clinic.jpg"),
      },
      {
        id: "ACT-001-B",
        judul: "Edukasi pasca layanan",
        fokus: "Tim Rail Clinic memberi arahan tindak lanjut keluarga.",
        tone: "ember",
        imageUrl: commonsFilePath("Jogjakarta Railway Station - Indonesia.jpg"),
      },
    ],
    createdBy: "USR-001",
  },
  {
    id: "ACT-002",
    namaKegiatan: "Pelayanan kesehatan gratis di Stasiun Kroya",
    tanggalKegiatan: "2026-02-18",
    lokasiStasiun: "Stasiun Kroya",
    wilayahDaop: "Daop 5 Purwokerto",
    jumlahLayanan: 176,
    keterangan:
      "Fokus pada skrining penyakit tidak menular dan pemeriksaan lansia dengan dukungan tim kesehatan wilayah setempat.",
    fotos: [
      {
        id: "ACT-002-A",
        judul: "Skrining tekanan darah",
        fokus: "Sesi pemeriksaan lansia di ruang tunggu komunitas.",
        tone: "meadow",
        imageUrl: commonsFilePath("Medical Examination Department.jpg"),
      },
      {
        id: "ACT-002-B",
        judul: "Koordinasi relawan lokal",
        fokus: "Pembagian alur pasien dan logistik harian kegiatan.",
        tone: "dusk",
        imageUrl: commonsFilePath("Lamongan railway station.jpg"),
      },
    ],
    createdBy: "USR-001",
  },
  {
    id: "ACT-003",
    namaKegiatan: "Rail Clinic peduli kesehatan ibu dan anak di Kutoarjo",
    tanggalKegiatan: "2026-01-25",
    lokasiStasiun: "Stasiun Kutoarjo",
    wilayahDaop: "Daop 5 Purwokerto",
    jumlahLayanan: 143,
    keterangan:
      "Pemeriksaan tumbuh kembang, konsultasi gizi, dan layanan kebidanan dasar bagi keluarga muda di wilayah sekitar jalur selatan.",
    fotos: [
      {
        id: "ACT-003-A",
        judul: "Layanan tumbuh kembang",
        fokus: "Pengukuran bayi dan konsultasi gizi keluarga.",
        tone: "ember",
        imageUrl: commonsFilePath("Health Clinic.jpg"),
      },
      {
        id: "ACT-003-B",
        judul: "Ruang konsultasi ibu",
        fokus: "Tim medis memberi arahan nutrisi dan jadwal kontrol.",
        tone: "ocean",
        imageUrl: commonsFilePath("Lempuyangan railway station.jpg"),
      },
    ],
    createdBy: "USR-001",
  },
  {
    id: "ACT-004",
    namaKegiatan: "Pemeriksaan terpadu komunitas pekerja di Stasiun Madiun",
    tanggalKegiatan: "2025-12-09",
    lokasiStasiun: "Stasiun Madiun",
    wilayahDaop: "Daop 7 Madiun",
    jumlahLayanan: 198,
    keterangan:
      "Layanan kesehatan umum dan screening kelelahan kerja untuk komunitas pekerja, porter, dan keluarga pegawai sekitar stasiun.",
    fotos: [
      {
        id: "ACT-004-A",
        judul: "Pemeriksaan pekerja lapangan",
        fokus: "Skrining kondisi umum untuk petugas operasional stasiun.",
        tone: "dusk",
        imageUrl: commonsFilePath("Sudirman railway station.jpg"),
      },
      {
        id: "ACT-004-B",
        judul: "Briefing tim akhir sesi",
        fokus: "Rekap jumlah layanan dan kebutuhan tindak lanjut wilayah.",
        tone: "meadow",
        imageUrl: commonsFilePath("Kandangan railway station.jpg"),
      },
    ],
    createdBy: "USR-001",
  },
];

export const handoverRecords: HandoverRecord[] = [
  {
    id: "HND-001",
    kegiatanAsal: "Stasiun Wates - Baksos Rail Clinic",
    kegiatanTujuan: "Stasiun Kroya - Pelayanan kesehatan gratis",
    tanggalSerahTerima: "2026-03-14",
    nippPenyerah: "20240117",
    namaPenyerah: "Mira Pratama",
    nippPenerima: "20240203",
    namaPenerima: "Raka Maheswara",
    fotos: [
      {
        id: "HND-001-A",
        judul: "Foto serah terima",
        fokus: "Penyerahan alat kesehatan antar tim kegiatan.",
        tone: "ocean",
        imageUrl: commonsFilePath("Medical Examination Department.jpg"),
      },
      {
        id: "HND-001-B",
        judul: "Foto dokumen checklist",
        fokus: "Dokumen checklist alat yang sudah diverifikasi.",
        tone: "ember",
        imageUrl: commonsFilePath("Health Clinic.jpg"),
      },
    ],
  },
  {
    id: "HND-002",
    kegiatanAsal: "Stasiun Kroya - Pelayanan kesehatan gratis",
    kegiatanTujuan: "Stasiun Kutoarjo - Layanan ibu dan anak",
    tanggalSerahTerima: "2026-02-20",
    nippPenyerah: "20240203",
    namaPenyerah: "Raka Maheswara",
    nippPenerima: "20240311",
    namaPenerima: "Sinta Puspitasari",
    fotos: [
      {
        id: "HND-002-A",
        judul: "Foto serah terima",
        fokus: "Serah terima perlengkapan sebelum keberangkatan tim.",
        tone: "meadow",
        imageUrl: commonsFilePath("Jogjakarta Railway Station - Indonesia.jpg"),
      },
      {
        id: "HND-002-B",
        judul: "Foto dokumen checklist",
        fokus: "Checklist kondisi alat dan kelengkapan pendukung.",
        tone: "dusk",
        imageUrl: commonsFilePath("Lempuyangan railway station.jpg"),
      },
    ],
  },
  {
    id: "HND-003",
    kegiatanAsal: "Stasiun Kutoarjo - Layanan ibu dan anak",
    kegiatanTujuan: "Stasiun Madiun - Pemeriksaan terpadu komunitas pekerja",
    tanggalSerahTerima: "2026-01-27",
    nippPenyerah: "20240311",
    namaPenyerah: "Sinta Puspitasari",
    nippPenerima: "20240421",
    namaPenerima: "Dian Kartika",
    fotos: [
      {
        id: "HND-003-A",
        judul: "Foto serah terima",
        fokus: "Serah terima alat antar koordinator kegiatan lapangan.",
        tone: "dusk",
        imageUrl: commonsFilePath("Lamongan railway station.jpg"),
      },
      {
        id: "HND-003-B",
        judul: "Foto dokumen checklist",
        fokus: "Dokumen checklist final sebelum alat diberangkatkan.",
        tone: "ocean",
        imageUrl: commonsFilePath("Kandangan railway station.jpg"),
      },
    ],
  },
];
