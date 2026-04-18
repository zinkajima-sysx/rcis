import {
  referenceDate,
  type MedicalEquipment,
  type UserRole,
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

export function getDashboardMetrics(equipment: MedicalEquipment[]) {
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

export function getCalibrationAlerts(equipment: MedicalEquipment[]) {
  return equipment
    .filter((item) => getCalibrationTone(item.tglRencanaKalibrasi) !== "safe")
    .sort((a, b) => new Date(a.tglRencanaKalibrasi).getTime() - new Date(b.tglRencanaKalibrasi).getTime());
}

export function getUpcomingSchedule(equipment: MedicalEquipment[]) {
  return equipment
    .sort((a, b) => new Date(a.tglRencanaKalibrasi).getTime() - new Date(b.tglRencanaKalibrasi).getTime())
    .filter((item) => getCalibrationTone(item.tglRencanaKalibrasi) !== "safe");
}

export function getCategoryTotals(equipment: MedicalEquipment[], categories: EquipmentCategory[]) {
  return categories.map(cat => ({
    id: cat.code,
    total: equipment.filter(item => item.kategoriId === cat.code).length
  }));
}

export function getTotalActivities(activities: RailClinicActivity[]) {
  return activities.length;
}

export function getRecentActivities(activities: RailClinicActivity[]) {
  return activities.slice(0, 2);
}
