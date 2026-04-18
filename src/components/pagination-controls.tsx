"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  pageCount: number;
  itemCount: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  pageCount,
  itemCount,
  pageSize,
  itemLabel,
  onPageChange,
}: PaginationControlsProps) {
  const rangeStart = itemCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, itemCount);

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {rangeStart}-{rangeEnd} dari {itemCount} {itemLabel}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Sebelumnya
        </Button>
        <div className="min-w-20 text-center text-sm font-medium text-foreground">
          {page} / {pageCount}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Berikutnya
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
