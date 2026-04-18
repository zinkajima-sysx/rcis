import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";

import { EntityManagement } from "@/components/entity-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEntities } from "@/lib/rci-data";

export const metadata: Metadata = {
  title: "Manajemen Entitas",
};

export default async function EntitiesPage() {
  const entities = await getEntities();

  return (
    <div className="flex flex-col gap-6">
      <Card className="surface-panel border-white/70 shadow-lg shadow-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="status-safe border-transparent">
              {entities.length} entitas
            </Badge>
          </div>
          <CardTitle className="text-3xl">Manajemen Entitas</CardTitle>
          <CardDescription>
            Kelola entitas organisasi dan unit kerja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end">
            <Button>
              <PlusIcon data-icon="inline-start" />
              Tambah Entitas
            </Button>
          </div>
        </CardContent>
      </Card>

      <EntityManagement entities={entities} />
    </div>
  );
}