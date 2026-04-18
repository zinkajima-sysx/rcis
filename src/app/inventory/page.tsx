import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";

import { InventoryExplorer } from "@/components/inventory-explorer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEquipmentCategories, getMedicalEquipments } from "@/lib/rci-data";
import { getDashboardMetrics } from "@/lib/rci-utils";

export const metadata: Metadata = {
  title: "Inventaris Alkes",
};

export default async function InventoryPage() {
  const medicalEquipments = await getMedicalEquipments();
  const equipmentCategories = await getEquipmentCategories();
  const metrics = getDashboardMetrics(medicalEquipments);

  return (
    <div className="flex flex-col gap-6">
      <Card className="surface-panel border-white/70 shadow-lg shadow-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="status-safe border-transparent">
              {medicalEquipments.length} aset aktif
            </Badge>
          </div>
          <CardTitle className="text-3xl">Inventaris alat kesehatan</CardTitle>
          <CardDescription>Data alat, status, dan jadwal kalibrasi.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.slice(0, 3).map((metric) => (
              <div
                key={metric.id}
                className="rounded-2xl border border-border/70 bg-white/80 p-4"
              >
                <div className="text-sm text-muted-foreground">
                  {metric.label}
                </div>
                <div className="mt-1 font-mono text-2xl font-semibold text-primary">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline">
            <DownloadIcon data-icon="inline-start" />
            Ekspor
          </Button>
        </CardContent>
      </Card>

      <InventoryExplorer
        medicalEquipments={medicalEquipments}
        equipmentCategories={equipmentCategories}
      />
    </div>
  );
}
