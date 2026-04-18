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
    return { ...act, fotos: photos };
  }));
  return activitiesWithPhotos;
}

export async function getHandoverRecords() {
  const records = await db.select().from(schema.handovers);
  return await Promise.all(records.map(async (ho) => {
    const photos = await db.select().from(schema.handoverPhotos).where(eq(schema.handoverPhotos.handoverId, ho.id));
    return { ...ho, fotos: photos };
  }));
}
