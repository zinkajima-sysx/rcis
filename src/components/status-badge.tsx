import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: "Layak Pakai" | "Butuh Perbaikan" | "Rusak / Tidak Layak";
};

const statusClassMap = {
  "Layak Pakai": "status-safe",
  "Butuh Perbaikan": "status-warning",
  "Rusak / Tidak Layak": "status-danger",
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "w-fit border-transparent font-medium shadow-none",
        statusClassMap[status]
      )}
    >
      {status}
    </Badge>
  );
}
