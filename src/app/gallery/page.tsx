import type { Metadata } from "next";
import { ImagesIcon, MapPinnedIcon, UsersIcon } from "lucide-react";

import { GalleryCollection } from "@/components/gallery-collection";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDaopDivres,
  getEntities,
  getRailClinicActivities,
} from "@/lib/rci-data";
import { getGallerySummary } from "@/lib/rci-utils";

export const metadata: Metadata = {
  title: "Galeri Kegiatan",
};

const galleryIcons = {
  activities: ImagesIcon,
  coverage: MapPinnedIcon,
  visitors: UsersIcon,
};

export default async function GalleryPage() {
  const activities = await getRailClinicActivities();
  const entities = await getEntities();
  const daopDivres = await getDaopDivres();
  const summary = getGallerySummary(activities);

  return (
    <div className="flex flex-col gap-6">
      <Card className="surface-panel border-white/70 shadow-lg shadow-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="status-warning border-transparent">
              Standar 2 foto per kegiatan
            </Badge>
          </div>
          <CardTitle className="text-3xl">Galeri kegiatan Rail Clinic</CardTitle>
          <CardDescription>Arsip kegiatan dan foto nyata.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {summary.map((item) => {
            const Icon = galleryIcons[item.id];

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/70 bg-white/80 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="font-mono text-2xl font-semibold text-primary">
                      {item.value}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <GalleryCollection
        activities={activities}
        entities={entities}
        daopDivres={daopDivres}
      />
    </div>
  );
}
