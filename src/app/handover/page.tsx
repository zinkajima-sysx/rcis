import type { Metadata } from "next";
import { ClipboardCheckIcon, FileImageIcon, Repeat2Icon } from "lucide-react";

import { HandoverCollection } from "@/components/handover-collection";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { handoverRecords } from "@/lib/rci-data";

export const metadata: Metadata = {
  title: "Handover",
};

const handoverSummary = [
  {
    id: "records",
    label: "Total handover",
    value: handoverRecords.length,
    icon: Repeat2Icon,
  },
  {
    id: "photos",
    label: "Foto handover",
    value: handoverRecords.length,
    icon: FileImageIcon,
  },
  {
    id: "checklists",
    label: "Foto checklist",
    value: handoverRecords.length,
    icon: ClipboardCheckIcon,
  },
];

export default function HandoverPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="surface-panel border-white/70 shadow-lg shadow-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="status-warning border-transparent">
              2 foto wajib per serah terima
            </Badge>
          </div>
          <CardTitle className="text-3xl">Handover alat kesehatan</CardTitle>
          <CardDescription>
            Bukti serah terima alat kesehatan antar tempat kegiatan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {handoverSummary.map((item) => {
            const Icon = item.icon;

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

      <HandoverCollection handovers={handoverRecords} />
    </div>
  );
}
