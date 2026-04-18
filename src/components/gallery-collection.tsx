"use client";

import { useState } from "react";

import { PaginationControls } from "@/components/pagination-controls";
import { PhotoTile } from "@/components/photo-tile";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_CARD_PAGE_SIZE, paginateItems } from "@/lib/pagination";
import { type RailClinicActivity } from "@/lib/rci-data";
import { formatDateLong } from "@/lib/rci-utils";

type GalleryCollectionProps = {
  activities: RailClinicActivity[];
};

export function GalleryCollection({ activities }: GalleryCollectionProps) {
  const [page, setPage] = useState(1);

  const paginated = paginateItems(activities, page, DEFAULT_CARD_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-2">
        {paginated.items.map((activity) => (
          <Card key={activity.id} className="border-white/60 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{activity.wilayahDaop}</Badge>
                <Badge variant="outline">{activity.jumlahLayanan} layanan</Badge>
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
