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
  fotos: HandoverPhoto[];
};
