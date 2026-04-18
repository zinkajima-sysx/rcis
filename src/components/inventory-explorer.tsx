"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import {
  CalendarClockIcon,
  LayoutGridIcon,
  SearchIcon,
  TablePropertiesIcon,
} from "lucide-react";

import { PaginationControls } from "@/components/pagination-controls";
import { PhotoTile } from "@/components/photo-tile";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_CARD_PAGE_SIZE,
  DEFAULT_TABLE_ROWS,
  TABLE_PAGE_SIZE_OPTIONS,
  paginateItems,
} from "@/lib/pagination";
import {
  equipmentCategories,
  medicalEquipments,
  type MedicalEquipment,
} from "@/lib/rci-data";
import {
  formatDateLong,
  getCalibrationTone,
  getDaysUntilCalibration,
  getInventorySummary,
} from "@/lib/rci-utils";

type StatusFilter = MedicalEquipment["statusKelayakan"] | "all";
type CategoryFilter = MedicalEquipment["kategoriId"] | "all";
type ViewMode = "table" | "cards";

export function InventoryExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [tableRows, setTableRows] = useState(DEFAULT_TABLE_ROWS);
  const [tablePage, setTablePage] = useState(1);
  const [cardPage, setCardPage] = useState(1);

  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());

  const filteredEquipments = useMemo(() => {
    return medicalEquipments.filter((item) => {
      const matchesSearch =
        deferredSearch.length === 0 ||
        item.namaAlat.toLowerCase().includes(deferredSearch) ||
        item.merekTipe.toLowerCase().includes(deferredSearch);
      const matchesStatus =
        statusFilter === "all" || item.statusKelayakan === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || item.kategoriId === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, deferredSearch, statusFilter]);

  const summary = getInventorySummary(filteredEquipments);
  const paginatedTable = useMemo(
    () => paginateItems(filteredEquipments, tablePage, tableRows),
    [filteredEquipments, tablePage, tableRows]
  );
  const paginatedCards = useMemo(
    () => paginateItems(filteredEquipments, cardPage, DEFAULT_CARD_PAGE_SIZE),
    [filteredEquipments, cardPage]
  );

  const resetPagination = () => {
    setTablePage(1);
    setCardPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-white/60 shadow-sm">
        <CardHeader>
          <CardTitle>Filter inventaris</CardTitle>
          <CardDescription>
            Cari berdasarkan nama alat atau merek, lalu fokuskan hasil sesuai
            kategori dan status kelayakan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FieldSet>
            <FieldLegend>Filter aktif</FieldLegend>
            <FieldDescription>
              Aturan global: tabel 10 baris per halaman, kartu 6 item per halaman.
            </FieldDescription>
            <FieldGroup className="lg:grid lg:grid-cols-[1.4fr_0.9fr_0.9fr]">
              <Field>
                <FieldLabel htmlFor="inventory-search">Nama alat atau merek</FieldLabel>
                <Input
                  id="inventory-search"
                  value={searchTerm}
                  placeholder="Contoh: EKG, inkubator, Omron"
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    resetPagination();
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status-filter">Status kelayakan</FieldLabel>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    startTransition(() => {
                      setStatusFilter(value as StatusFilter);
                      resetPagination();
                    })
                  }
                >
                  <SelectTrigger id="status-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Semua status</SelectItem>
                      <SelectItem value="Layak Pakai">Layak Pakai</SelectItem>
                      <SelectItem value="Butuh Perbaikan">
                        Butuh Perbaikan
                      </SelectItem>
                      <SelectItem value="Rusak / Tidak Layak">
                        Rusak / Tidak Layak
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="category-filter">Kategori alkes</FieldLabel>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) =>
                    startTransition(() => {
                      setCategoryFilter(value as CategoryFilter);
                      resetPagination();
                    })
                  }
                >
                  <SelectTrigger id="category-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Semua kategori</SelectItem>
                      {equipmentCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nama}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-secondary/60 p-4">
              <div className="text-sm text-muted-foreground">Hasil tampil</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-primary">
                {summary.total}
              </div>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-4">
              <div className="text-sm text-muted-foreground">Layak pakai</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-primary">
                {summary.layak}
              </div>
            </div>
            <div className="rounded-2xl bg-secondary/60 p-4">
              <div className="text-sm text-muted-foreground">Perlu tindakan</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-primary">
                {summary.butuhTindakan}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={viewMode}
        onValueChange={(value) =>
          startTransition(() => {
            setViewMode(value as ViewMode);
          })
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SearchIcon className="size-4" />
            Menampilkan {filteredEquipments.length} item inventaris
          </div>
          <TabsList variant="line">
            <TabsTrigger value="table">
              <TablePropertiesIcon data-icon="inline-start" />
              Tabel
            </TabsTrigger>
            <TabsTrigger value="cards">
              <LayoutGridIcon data-icon="inline-start" />
              Kartu
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table">
          <Card className="border-white/60 shadow-sm">
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Default baris per halaman: {DEFAULT_TABLE_ROWS}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Baris per halaman
                  </span>
                  <Select
                    value={String(tableRows)}
                    onValueChange={(value) => {
                      setTableRows(Number(value));
                      setTablePage(1);
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TABLE_PAGE_SIZE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={String(option)}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama alat</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Merek/Tipe</TableHead>
                    <TableHead>Tahun</TableHead>
                    <TableHead>Kalibrasi terakhir</TableHead>
                    <TableHead>Rencana berikutnya</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTable.items.map((item) => {
                    const category = equipmentCategories.find(
                      (entry) => entry.id === item.kategoriId
                    );
                    const tone = getCalibrationTone(item.tglRencanaKalibrasi);
                    const days = getDaysUntilCalibration(item.tglRencanaKalibrasi);

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.namaAlat}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.lokasiPenempatan}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{category?.nama}</TableCell>
                        <TableCell>{item.merekTipe}</TableCell>
                        <TableCell>{item.tahunPengadaan}</TableCell>
                        <TableCell>{formatDateLong(item.tglKalibrasiTerakhir)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{formatDateLong(item.tglRencanaKalibrasi)}</span>
                            <Badge
                              className={
                                tone === "danger"
                                  ? "status-danger border-transparent"
                                  : tone === "warning"
                                    ? "status-warning border-transparent"
                                    : "status-safe border-transparent"
                              }
                            >
                              {days < 0
                                ? `${Math.abs(days)} hari lewat`
                                : `${days} hari lagi`}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.statusKelayakan} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <PaginationControls
                page={paginatedTable.page}
                pageCount={paginatedTable.pageCount}
                itemCount={filteredEquipments.length}
                pageSize={tableRows}
                itemLabel="baris"
                onPageChange={setTablePage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {paginatedCards.items.map((item) => {
                const category = equipmentCategories.find(
                  (entry) => entry.id === item.kategoriId
                );
                const tone = getCalibrationTone(item.tglRencanaKalibrasi);

                return (
                  <Card key={item.id} className="border-white/60 shadow-sm">
                    <CardContent className="flex flex-col gap-4 pt-4">
                      <PhotoTile
                        title={item.namaAlat}
                        subtitle={item.lokasiPenempatan}
                        tone={item.visualTone}
                        imageUrl={item.imageUrl}
                        badgeLabel="Poto Alkes"
                      />
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={item.statusKelayakan} />
                          <Badge variant="outline">{category?.nama}</Badge>
                        </div>
                        <div className="text-lg font-semibold">{item.namaAlat}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.merekTipe} • pengadaan {item.tahunPengadaan}
                        </div>
                      </div>
                      <div className="grid gap-3 rounded-2xl bg-secondary/50 p-4 sm:grid-cols-2">
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Kalibrasi terakhir
                          </div>
                          <div className="mt-1 font-medium">
                            {formatDateLong(item.tglKalibrasiTerakhir)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Rencana berikutnya
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 font-medium">
                            <CalendarClockIcon className="size-4 text-primary" />
                            {formatDateLong(item.tglRencanaKalibrasi)}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={
                          tone === "danger"
                            ? "status-danger border-transparent"
                            : tone === "warning"
                              ? "status-warning border-transparent"
                              : "status-safe border-transparent"
                        }
                      >
                        {item.keteranganKalibrasi}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <PaginationControls
              page={paginatedCards.page}
              pageCount={paginatedCards.pageCount}
              itemCount={filteredEquipments.length}
              pageSize={DEFAULT_CARD_PAGE_SIZE}
              itemLabel="kartu"
              onPageChange={setCardPage}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
