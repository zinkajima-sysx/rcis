"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import {
  CalendarClockIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TablePropertiesIcon,
  TrashIcon,
} from "lucide-react";

import { ActivityForm } from "@/components/activity-form";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteActivityAction } from "@/lib/activity-actions";
import {
  DEFAULT_CARD_PAGE_SIZE,
  DEFAULT_TABLE_ROWS,
  TABLE_PAGE_SIZE_OPTIONS,
  paginateItems,
} from "@/lib/pagination";
import {
  type DaopDivre,
  type Entity,
  type RailClinicActivity,
  type UserRole,
} from "@/lib/types";
import { formatDateLong } from "@/lib/rci-utils";
import { cn } from "@/lib/utils";

type StatusFilter = RailClinicActivity["status"] | "all";
type ViewMode = "table" | "cards";

type ScheduleExplorerProps = {
  activities: RailClinicActivity[];
  entities: Entity[];
  daopDivres: DaopDivre[];
  userRole: UserRole;
};

export function ScheduleExplorer({
  activities,
  entities,
  daopDivres,
  userRole,
}: ScheduleExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [tableRows, setTableRows] = useState(DEFAULT_TABLE_ROWS);
  const [tablePage, setTablePage] = useState(1);
  const [cardPage, setCardPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // RBAC: Superadmin, Admin, Manager Unit Kesehatan, Assman
  const canEdit = useMemo(() => {
    return ["super_admin", "admin", "manager_unit_kesehatan", "assman"].includes(userRole);
  }, [userRole]);

  // CRUD State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<RailClinicActivity | null>(null);

  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      const matchesSearch =
        deferredSearch.length === 0 ||
        item.namaKegiatan.toLowerCase().includes(deferredSearch) ||
        item.lokasiStasiun.toLowerCase().includes(deferredSearch) ||
        item.kodeKegiatan.toLowerCase().includes(deferredSearch);
      
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      
      const matchesRegion =
        regionFilter === "all" || item.daopDivreId === regionFilter;

      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [activities, deferredSearch, statusFilter, regionFilter]);

  const paginatedTable = useMemo(
    () => paginateItems(filteredActivities, tablePage, tableRows),
    [filteredActivities, tablePage, tableRows]
  );
  const paginatedCards = useMemo(
    () => paginateItems(filteredActivities, cardPage, DEFAULT_CARD_PAGE_SIZE),
    [filteredActivities, cardPage]
  );

  const resetPagination = () => {
    setTablePage(1);
    setCardPage(1);
  };

  const openForm = (activity: RailClinicActivity | null = null) => {
    if (!canEdit) return;
    setSelectedActivity(activity);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedActivity(null);
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      startTransition(async () => {
        const result = await deleteActivityAction(id);
        if (!result.success) {
          alert("Gagal menghapus jadwal: " + result.error);
        }
      });
    }
  };

  const getStatusBadgeVariant = (status: RailClinicActivity["status"]) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "scheduled": return "outline";
      case "draft": return "outline";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedActivity ? "Edit Jadwal RC" : "Tambah Jadwal Baru"}
            </SheetTitle>
            <SheetDescription>
              Lengkapi data jadwal kegiatan Rail Clinic di bawah ini.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ActivityForm
              activity={selectedActivity || undefined}
              entities={entities}
              daopDivres={daopDivres}
              onSuccess={closeForm}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Card className="border-white/60 shadow-sm">
        <CardHeader>
          <CardTitle>Filter Jadwal</CardTitle>
          <CardDescription>
            Cari jadwal kegiatan berdasarkan nama, lokasi stasiun, atau wilayah kerja.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FieldSet>
            <FieldLegend>Filter aktif</FieldLegend>
            <FieldGroup className="lg:grid lg:grid-cols-[1.4fr_0.9fr_0.9fr]">
              <Field>
                <FieldLabel htmlFor="schedule-search">Pencarian</FieldLabel>
                <Input
                  id="schedule-search"
                  value={searchTerm}
                  placeholder="Nama kegiatan, stasiun, atau kode..."
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    resetPagination();
                  }}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status-filter">Status</FieldLabel>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter((value || "all") as StatusFilter);
                    resetPagination();
                  }}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Terjadwal</SelectItem>
                      <SelectItem value="in_progress">Berjalan</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="region-filter">Wilayah (Daop/Divre)</FieldLabel>
                <Select
                  value={regionFilter}
                  onValueChange={(value) => {
                    setRegionFilter(value || "all");
                    resetPagination();
                  }}
                >
                  <SelectTrigger id="region-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Semua Wilayah</SelectItem>
                      {daopDivres.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Tabs
        value={viewMode}
        onValueChange={(value) => setViewMode(value as ViewMode)}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SearchIcon className="size-4" />
              Menampilkan {filteredActivities.length} jadwal
            </div>
            {canEdit && (
              <Button
                size="sm"
                className="rounded-full shadow-md"
                onClick={() => openForm(null)}
              >
                <PlusIcon data-icon="inline-start" />
                Tambah Jadwal
              </Button>
            )}
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
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Default: {DEFAULT_TABLE_ROWS} baris
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Baris</span>
                  <Select
                    value={String(tableRows)}
                    onValueChange={(v) => {
                      setTableRows(Number(v));
                      setTablePage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TABLE_PAGE_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={String(opt)}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Kegiatan</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Wilayah</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTable.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.kodeKegiatan}</TableCell>
                      <TableCell className="font-medium">{item.namaKegiatan}</TableCell>
                      <TableCell>{item.lokasiStasiun}</TableCell>
                      <TableCell>{item.wilayahDaop}</TableCell>
                      <TableCell>{formatDateLong(item.tanggalKegiatan)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => openForm(item)}
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive"
                                onClick={() => handleDelete(item.id)}
                                disabled={isPending}
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            </>
                          )}
                          {!canEdit && (
                            <span className="text-xs text-muted-foreground italic">ReadOnly</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedTable.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Tidak ada jadwal ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <PaginationControls
                page={paginatedTable.page}
                pageCount={paginatedTable.pageCount}
                itemCount={filteredActivities.length}
                pageSize={tableRows}
                itemLabel="jadwal"
                onPageChange={setTablePage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <div className="grid gap-6 xl:grid-cols-2">
            {paginatedCards.items.map((item) => (
              <Card key={item.id} className="border-white/60 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status}
                        </Badge>
                        <Badge variant="secondary">{item.wilayahDaop}</Badge>
                      </div>
                      <CardTitle className="mt-2">{item.namaKegiatan}</CardTitle>
                      <CardDescription>
                        {item.lokasiStasiun} • {formatDateLong(item.tanggalKegiatan)}
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openForm(item)}>
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(item.id)} disabled={isPending}>
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 rounded-2xl bg-secondary/40 p-4">
                    <CalendarClockIcon className="size-8 text-primary/40" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mulai</span>
                      <span className="font-semibold">{formatDateLong(item.tanggalKegiatan)}</span>
                    </div>
                    {item.tanggalSelesai && (
                      <div className="flex flex-col border-l pl-4 ml-auto text-right">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selesai</span>
                        <span className="font-semibold">{formatDateLong(item.tanggalSelesai)}</span>
                      </div>
                    )}
                  </div>
                  {item.deskripsi && (
                    <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                      {item.deskripsi}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <PaginationControls
              page={paginatedCards.page}
              pageCount={paginatedCards.pageCount}
              itemCount={filteredActivities.length}
              pageSize={DEFAULT_CARD_PAGE_SIZE}
              itemLabel="jadwal"
              onPageChange={setCardPage}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
