import {
  referenceDate,
  type MedicalEquipment,
  type EnhancedMedicalEquipment,
  type UserRole,
  type EquipmentCategory,
  type RailClinicActivity,
} from "@/lib/rci-data";

export type CalibrationTone = "safe" | "warning" | "danger";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function parseDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`);
}

function getReferenceDate() {
  return parseDate(referenceDate);
}

export function formatDateLong(value: string) {
  return dateFormatter.format(parseDate(value));
}

export function formatRoleLabel(role: UserRole) {
  if (role === "petugas_medis") {
    return "Petugas Medis";
  }

  if (role === "manajemen") {
    return "Manajemen";
  }

  return "Admin";
}

export function getDaysUntilCalibration(date: string) {
  const milliseconds = parseDate(date).getTime() - getReferenceDate().getTime();
  return Math.round(milliseconds / 86400000);
}

export function getCalibrationTone(date: string): CalibrationTone {
  const days = getDaysUntilCalibration(date);

  if (days < 0) {
    return "danger";
  }

  if (days <= 30) {
    return "warning";
  }

  return "safe";
}

function getCalibrationLabel(date: string) {
  const days = getDaysUntilCalibration(date);

  if (days < 0) {
    return `Terlambat ${Math.abs(days)} hari`;
  }

  if (days <= 30) {
    return `Jatuh tempo ${days} hari lagi`;
  }

  return `Tenggat ${days} hari lagi`;
}

export function enhanceEquipmentWithCalibration(equipment: MedicalEquipment[]): EnhancedMedicalEquipment[] {
  return equipment.map(item => ({
    ...item,
    calibrationTone: getCalibrationTone(item.tglRencanaKalibrasi),
    calibrationLabel: getCalibrationLabel(item.tglRencanaKalibrasi),
  }));
}

export function getInventorySummary(equipment: MedicalEquipment[]) {
  const total = equipment.length;
  const layak = equipment.filter(item => item.statusKelayakan === "Layak Pakai").length;
  const perbaikan = equipment.filter(item => item.statusKelayakan === "Butuh Perbaikan").length;
  const rusak = equipment.filter(item => item.statusKelayakan === "Rusak / Tidak Layak").length;
  const alerts = equipment.filter(item => getCalibrationTone(item.tglRencanaKalibrasi) !== "safe").length;

  return {
    total,
    layak,
    perbaikan,
    rusak,
    alerts,
  };
}

export function getGallerySummary(activities: RailClinicActivity[]) {
  const total = activities.length;
  const totalPhotos = activities.reduce((sum, activity) => sum + activity.fotos.length, 0);

  return {
    totalActivities: total,
    totalPhotos,
  };
}

export function getDashboardMetrics(equipment: EnhancedMedicalEquipment[]) {
  const total = equipment.length;
  const layak = equipment.filter(
    (item) => item.statusKelayakan === "Layak Pakai"
  ).length;
  const alerts = equipment.filter(
    (item) => getCalibrationTone(item.tglRencanaKalibrasi) !== "safe"
  ).length;

  return [
    {
      id: "total" as const,
      label: "Total alkes",
      value: total,
      helper: "Seluruh aset kesehatan yang terdata pada sistem.",
    },
    {
      id: "ready" as const,
      label: "Layak pakai",
      value: layak,
      helper: "Alat dalam status siap dipakai untuk pelayanan.",
    },
    {
      id: "alerts" as const,
      label: "Alert kalibrasi",
      value: alerts,
      helper: "Alat yang butuh kalibrasi segera.",
    },
    {
      id: "activities" as const,
      label: "Kegiatan",
      value: 0,
      helper: "Total kegiatan baksos yang terdokumentasi.",
    },
  ];
}

export function getCalibrationAlerts(equipment: EnhancedMedicalEquipment[]) {
  return equipment
    .filter((item) => item.calibrationTone !== "safe")
    .sort((a, b) => new Date(a.tglRencanaKalibrasi).getTime() - new Date(b.tglRencanaKalibrasi).getTime());
}

export function getUpcomingSchedule(equipment: EnhancedMedicalEquipment[]) {
  return equipment
    .filter((item) => item.calibrationTone !== "safe")
    .sort((a, b) => new Date(a.tglRencanaKalibrasi).getTime() - new Date(b.tglRencanaKalibrasi).getTime());
}

export function getCategoryTotals(equipment: EnhancedMedicalEquipment[], categories: EquipmentCategory[]) {
  return categories.map(cat => {
    const total = equipment.filter(item => item.kategoriId === cat.id).length;
    const layak = equipment.filter(item => item.kategoriId === cat.id && item.statusKelayakan === "Layak Pakai").length;
    const perbaikan = equipment.filter(item => item.kategoriId === cat.id && item.statusKelayakan === "Butuh Perbaikan").length;
    const rusak = equipment.filter(item => item.kategoriId === cat.id && item.statusKelayakan === "Rusak / Tidak Layak").length;

    return {
      id: cat.id,
      nama: cat.nama,
      total,
      layak,
      perbaikan,
      rusak,
    };
  });
}

export function getTotalActivities(activities: RailClinicActivity[]) {
  return activities.length;
}

export function getRecentActivities(activities: RailClinicActivity[]) {
  return activities.slice(0, 2);
}
