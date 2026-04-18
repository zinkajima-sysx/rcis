import {
  equipmentCategories,
  medicalEquipments,
  railClinicActivities,
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

export function getDashboardMetrics() {
  const total = medicalEquipments.length;
  const layak = medicalEquipments.filter(
    (item) => item.statusKelayakan === "Layak Pakai"
  ).length;
  const alerts = medicalEquipments.filter(
    (item) => getCalibrationTone(item.tglRencanaKalibrasi) !== "safe"
  ).length;

  return [
    {
      id: "total" as const,
      label: "Total alkes",
      value: total,
      helper: "Seluruh aset kesehatan yang terdata pada prototype ini.",
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
      helper: "Alat yang sudah lewat atau kurang dari 30 hari ke due date.",
    },
    {
      id: "activities" as const,
      label: "Kegiatan terdokumentasi",
      value: railClinicActivities.length,
      helper: "Entri galeri dengan standar dua foto unggulan.",
    },
  ];
}

export function getCalibrationAlerts() {
  return medicalEquipments
    .filter((item) => getCalibrationTone(item.tglRencanaKalibrasi) !== "safe")
    .sort(
      (first, second) =>
        getDaysUntilCalibration(first.tglRencanaKalibrasi) -
        getDaysUntilCalibration(second.tglRencanaKalibrasi)
    )
    .map((item) => ({
      ...item,
      calibrationTone: getCalibrationTone(item.tglRencanaKalibrasi),
      calibrationLabel: getCalibrationLabel(item.tglRencanaKalibrasi),
    }));
}

export function getUpcomingSchedule() {
  return [...medicalEquipments]
    .sort(
      (first, second) =>
        parseDate(first.tglRencanaKalibrasi).getTime() -
        parseDate(second.tglRencanaKalibrasi).getTime()
    )
    .map((item) => ({
      ...item,
      calibrationTone: getCalibrationTone(item.tglRencanaKalibrasi),
      calibrationLabel: getCalibrationLabel(item.tglRencanaKalibrasi),
    }));
}

export function getCategoryTotals() {
  return equipmentCategories.map((category) => {
    const items = medicalEquipments.filter(
      (item) => item.kategoriId === category.id
    );

    return {
      id: category.id,
      nama: category.nama,
      total: items.length,
      layak: items.filter((item) => item.statusKelayakan === "Layak Pakai")
        .length,
      perbaikan: items.filter(
        (item) => item.statusKelayakan === "Butuh Perbaikan"
      ).length,
      rusak: items.filter(
        (item) => item.statusKelayakan === "Rusak / Tidak Layak"
      ).length,
    };
  });
}

export function getInventorySummary(items: MedicalEquipment[]) {
  return {
    total: items.length,
    layak: items.filter((item) => item.statusKelayakan === "Layak Pakai").length,
    butuhTindakan: items.filter(
      (item) => item.statusKelayakan !== "Layak Pakai"
    ).length,
  };
}

export function getGallerySummary() {
  const totalVisitors = railClinicActivities.reduce(
    (sum, activity) => sum + activity.jumlahLayanan,
    0
  );
  const areaCount = new Set(railClinicActivities.map((activity) => activity.wilayahDaop))
    .size;

  return [
    {
      id: "activities" as const,
      label: "Total kegiatan",
      value: railClinicActivities.length,
    },
    {
      id: "coverage" as const,
      label: "Cakupan wilayah",
      value: `${areaCount} daop`,
    },
    {
      id: "visitors" as const,
      label: "Layanan tercatat",
      value: totalVisitors,
    },
  ];
}
