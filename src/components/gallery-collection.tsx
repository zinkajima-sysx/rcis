"use client";

import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { ActivityForm } from "@/components/activity-form";
import { PaginationControls } from "@/components/pagination-controls";
import { PhotoTile } from "@/components/photo-tile";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { deleteActivityAction } from "@/lib/activity-actions";
import { DEFAULT_CARD_PAGE_SIZE, paginateItems } from "@/lib/pagination";
import {
  type DaopDivre,
  type Entity,
  type RailClinicActivity,
} from "@/lib/types";
import { formatDateLong } from "@/lib/rci-utils";

type GalleryCollectionProps = {
  activities: RailClinicActivity[];
  entities: Entity[];
  daopDivres: DaopDivre[];
};

export function GalleryCollection({
  activities,
  entities,
  daopDivres,
}: GalleryCollectionProps) {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // CRUD State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<RailClinicActivity | null>(null);

  const paginated = paginateItems(activities, page, DEFAULT_CARD_PAGE_SIZE);

  const openForm = (activity: RailClinicActivity | null = null) => {
    setSelectedActivity(activity);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedActivity(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) {
      startTransition(async () => {
        const result = await deleteActivityAction(id);
        if (!result.success) {
          alert("Gagal menghapus kegiatan: " + result.error);
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {activities.length} kegiatan
        </div>
        <Button onClick={() => openForm(null)}>
          <PlusIcon className="mr-2 size-4" />
          Tambah Kegiatan
        </Button>
      </div>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedActivity ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
            </SheetTitle>
            <SheetDescription>
              Lengkapi data kegiatan dan unggah foto dokumentasi (maksimal 2).
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

      <section className="grid gap-6 xl:grid-cols-2">
        {paginated.items.map((activity) => (
          <Card key={activity.id} className="border-white/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{activity.wilayahDaop}</Badge>
                  <Badge variant="outline">{activity.jumlahLayanan} layanan</Badge>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                    {activity.status}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => openForm(activity)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => handleDelete(activity.id)}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </div>
              <CardTitle>{activity.namaKegiatan}</CardTitle>
              <CardDescription>
                {activity.lokasiStasiun} • {formatDateLong(activity.tanggalKegiatan)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {activity.fotos.map((photo) => (
                  <PhotoTile
                    key={photo.id}
                    title={photo.judul}
                    subtitle={photo.fokus}
                    tone={photo.tone}
                    imageUrl={photo.imageUrl}
                    badgeLabel="Foto kegiatan"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <PaginationControls
        page={paginated.page}
        pageCount={paginated.pageCount}
        itemCount={activities.length}
        pageSize={DEFAULT_CARD_PAGE_SIZE}
        itemLabel="kartu"
        onPageChange={setPage}
      />
    </div>
  );
}
