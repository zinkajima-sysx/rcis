export type UserRole =
  | "super_admin"
  | "admin"
  | "admin_entity"
  | "petugas_medis"
  | "manajemen"
  | "manager_unit_kesehatan"
  | "assman"
  | "guest";

export type AppUser = {
  id: string;
  username: string;
  password?: string;
  namaLengkap: string;
  nipp?: string | null;
  role: UserRole;
  unit: string;
  entityId?: string;
  entityName?: string;
  isActive: boolean;
  accessValidFrom?: string | null;
  accessValidUntil?: string | null;
};

export type Entity = {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  createdAt: string;
};

export type DaopDivre = {
  id: string;
  code: string;
  name: string;
  type: "daop" | "divre";
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
  code?: string | null;
  serialNumber?: string | null;
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
  entityId?: string | null;
  entityName?: string | null;
  homeDaopDivreId?: string | null;
  homeDaopName?: string | null;
  currentDaopDivreId?: string | null;
  currentDaopName?: string | null;
};

export type EnhancedMedicalEquipment = MedicalEquipment & {
  calibrationTone: "safe" | "warning" | "danger";
  calibrationLabel: string;
};

export type RailClinicActivity = {
  id: string;
  entityId: string;
  daopDivreId: string;
  kodeKegiatan: string;
  namaKegiatan: string;
  tanggalKegiatan: string;
  tanggalSelesai?: string | null;
  lokasiStasiun: string;
  wilayahDaop: string;
  jumlahLayanan: number;
  status: "draft" | "scheduled" | "in_progress" | "completed" | "cancelled";
  deskripsi: string | null;
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
  fotos: HandoverPhoto[];
};
