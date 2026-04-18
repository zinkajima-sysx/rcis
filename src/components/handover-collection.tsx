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
import { type HandoverRecord } from "@/lib/rci-data";
import { formatDateLong } from "@/lib/rci-utils";

type HandoverCollectionProps = {
  handovers: HandoverRecord[];
};

export function HandoverCollection({ handovers }: HandoverCollectionProps) {
  const [page, setPage] = useState(1);
  const paginated = paginateItems(handovers, page, DEFAULT_CARD_PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-2">
        {paginated.items.map((handover) => (
          <Card key={handover.id} className="border-white/60 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{handover.id}</Badge>
                <Badge variant="outline">2 foto wajib</Badge>
              </div>
              <CardTitle>Handover alat kesehatan</CardTitle>
              <CardDescription>
                {handover.kegiatanAsal} ke {handover.kegiatanTujuan}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 rounded-2xl border border-border/80 bg-background/80 p-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Tanggal serah terima
                  </div>
                  <div className="font-medium">
                    {formatDateLong(handover.tanggalSerahTerima)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Rute kegiatan
                  </div>
                  <div className="font-medium">
                    {handover.kegiatanAsal}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      ke {handover.kegiatanTujuan}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Yang menyerahkan
                  </div>
                  <div className="font-medium">{handover.namaPenyerah}</div>
                  <div className="text-sm text-muted-foreground">
                    NIPP {handover.nippPenyerah}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Yang menerima
                  </div>
                  <div className="font-medium">{handover.namaPenerima}</div>
                  <div className="text-sm text-muted-foreground">
                    NIPP {handover.nippPenerima}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {handover.fotos.map((photo) => (
                  <PhotoTile
                    key={photo.id}
                    title={photo.judul}
                    subtitle={photo.fokus}
                    tone={photo.tone}
                    imageUrl={photo.imageUrl}
                    badgeLabel={photo.judul}
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
        itemCount={handovers.length}
        pageSize={DEFAULT_CARD_PAGE_SIZE}
        itemLabel="handover"
        onPageChange={setPage}
      />
    </div>
  );
}
