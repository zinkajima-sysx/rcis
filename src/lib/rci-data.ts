// TYPES - Must be defined BEFORE any imports that use them
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

export type EnhancedMedicalEquipment = MedicalEquipment & {
  calibrationTone: "safe" | "warning" | "danger";
  calibrationLabel: string;
};

export type RailClinicActivity = {
  id: string;
  namaKegiatan: string;
  tanggalKegiatan: string;
  lokasiStasiun: string;
  wilayahDaop: string;
  jumlahLayanan: number;
  keterangan: string;
  fotos: ActivityPhoto[];
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

// IMPORTS - After types are defined
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

export const referenceDate = "2026-04-18";

// MOCK DATA - For seed script reference only
export const mockAppUsers: AppUser[] = [
  { id: "USR-001", username: "mira.pratama", password: "railclinic123", namaLengkap: "Mira Pratama", role: "petugas_medis", unit: "Tim Medis Rail Clinic" },
  { id: "USR-002", username: "raka.manajemen", password: "railclinic123", namaLengkap: "Raka Maheswara", role: "manajemen", unit: "Manajemen Operasional" },
];

// DATABASE FUNCTIONS
export async function getCurrentUser() {
  const [user] = await db.select().from(schema.users).limit(1);
  return user ? {
    id: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: (user.roleLegacy || 'petugas_medis') as UserRole,
  } : null;
}

export async function getUsers() {
  return await db.select().from(schema.users);
}

export async function getEquipmentCategories() {
  const categories = await db.select().from(schema.equipmentCategories);
  return categories.map(cat => ({
    id: cat.code as EquipmentCategory["id"],
    nama: cat.name,
  }));
}

export async function getMedicalEquipments() {
  const equipments = await db.select({
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

  return equipments
    .filter(item => item.kategoriId !== null) // Filter out items without category
    .map(item => ({
      id: item.id,
      kategoriId: item.kategoriId as EquipmentCategory["id"],
      namaAlat: item.namaAlat,
      merekTipe: item.merekTipe || "",
      tahunPengadaan: item.tahunPengadaan || 0,
      tglKalibrasiTerakhir: item.tglKalibrasiTerakhir?.toISOString().split('T')[0] || "",
      tglRencanaKalibrasi: item.tglRencanaKalibrasi?.toISOString().split('T')[0] || "",
      statusKelayakan: item.statusKelayakan,
      lokasiPenempatan: item.lokasiPenempatan || "",
      createdBy: item.createdBy || "",
      visualTone: (item.visualTone as PhotoTone) || "ocean",
      keteranganKalibrasi: item.keteranganKalibrasi || "",
      imageUrl: item.imageUrl || "",
    }));
}

export async function getRailClinicActivities() {
  const activities = await db.select({
    id: schema.railClinicActivities.id,
    namaKegiatan: schema.railClinicActivities.name,
    tanggalKegiatan: schema.railClinicActivities.date,
    lokasiStasiun: schema.railClinicActivities.location,
    wilayahDaop: schema.railClinicActivities.region,
    jumlahLayanan: schema.railClinicActivities.serviceCount,
    keterangan: schema.railClinicActivities.description,
    createdBy: schema.railClinicActivities.createdBy,
  })
  .from(schema.railClinicActivities);

  // For now, return activities without photos since we need to join with activityPhotos
  // This is a simplified version - in a real app you'd join with photos
  return activities.map(activity => ({
    id: activity.id,
    namaKegiatan: activity.namaKegiatan,
    tanggalKegiatan: activity.tanggalKegiatan?.toISOString().split('T')[0] || "",
    lokasiStasiun: activity.lokasiStasiun,
    wilayahDaop: activity.wilayahDaop || "",
    jumlahLayanan: activity.jumlahLayanan || 0,
    keterangan: activity.keterangan || "",
    fotos: [
      {
        id: `${activity.id}-photo-1`,
        judul: "Foto Kegiatan 1",
        fokus: "Aktivitas utama",
        tone: "ocean" as PhotoTone,
        imageUrl: "/placeholder-activity.jpg",
      },
      {
        id: `${activity.id}-photo-2`,
        judul: "Foto Kegiatan 2",
        fokus: "Dokumentasi",
        tone: "meadow" as PhotoTone,
        imageUrl: "/placeholder-activity.jpg",
      },
    ],
    createdBy: activity.createdBy || "",
  }));
}

export async function getHandoverRecords() {
  const records = await db.select().from(schema.handovers);
  return await Promise.all(records.map(async (ho) => {
    const photos = await db.select().from(schema.handoverPhotos).where(eq(schema.handoverPhotos.handoverId, ho.id));
    return { ...ho, fotos: photos };
  }));
}
