import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import { formatDateLong } from "./rci-utils";
import { MedicalEquipment, EquipmentCategory } from "./types";

// Extend jsPDF with autotable types
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function exportToExcel(
  data: MedicalEquipment[],
  categories: EquipmentCategory[]
) {
  const headers = [
    "Nama Alat",
    "Kategori",
    "Merek/Tipe",
    "Tahun Pengadaan",
    "Lokasi Penempatan",
    "Tgl Kalibrasi Terakhir",
    "Tgl Rencana Kalibrasi",
    "Status Kelayakan",
  ];

  const rows = data.map((item) => {
    const category = categories.find((c) => c.id === item.kategoriId);
    return {
      "Nama Alat": item.namaAlat,
      Kategori: category?.nama || "",
      "Merek/Tipe": item.merekTipe,
      "Tahun Pengadaan": item.tahunPengadaan,
      "Lokasi Penempatan": item.lokasiPenempatan,
      "Tgl Kalibrasi Terakhir": item.tglKalibrasiTerakhir,
      "Tgl Rencana Kalibrasi": item.tglRencanaKalibrasi,
      "Status Kelayakan": item.statusKelayakan,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaris");

  // Fix column widths
  const wscols = [
    { wch: 30 }, // Nama Alat
    { wch: 20 }, // Kategori
    { wch: 20 }, // Merek/Tipe
    { wch: 15 }, // Tahun Pengadaan
    { wch: 25 }, // Lokasi Penempatan
    { wch: 20 }, // Tgl Kalibrasi Terakhir
    { wch: 20 }, // Tgl Rencana Kalibrasi
    { wch: 20 }, // Status Kelayakan
  ];
  worksheet["!cols"] = wscols;

  XLSX.writeFile(
    workbook,
    `inventaris_alkes_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

export function exportToPDF(
  data: MedicalEquipment[],
  categories: EquipmentCategory[]
) {
  const doc = new jsPDF("landscape");

  doc.setFontSize(18);
  doc.text("Laporan Inventaris Alat Kesehatan", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 30);

  const tableRows = data.map((item) => {
    const category = categories.find((c) => c.id === item.kategoriId);
    return [
      item.namaAlat,
      category?.nama || "",
      item.merekTipe,
      item.tahunPengadaan,
      item.lokasiPenempatan,
      formatDateLong(item.tglKalibrasiTerakhir),
      formatDateLong(item.tglRencanaKalibrasi),
      item.statusKelayakan,
    ];
  });

  doc.autoTable({
    startY: 35,
    head: [
      [
        "Nama Alat",
        "Kategori",
        "Merek/Tipe",
        "Thn",
        "Lokasi",
        "Kalibrasi Terakhir",
        "Rencana Berikutnya",
        "Status",
      ],
    ],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [0, 51, 153] }, // KAI Navy Blue approx
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30 },
      7: { cellWidth: 30 },
    },
  });

  doc.save(`inventaris_alkes_${new Date().toISOString().split("T")[0]}.pdf`);
}
