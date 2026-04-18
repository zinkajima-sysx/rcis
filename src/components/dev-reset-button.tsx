"use client";

import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type DevResetButtonProps = {
  compact?: boolean;
};

export function DevResetButton({ compact = false }: DevResetButtonProps) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const handleReset = async () => {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();

      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }

    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size={compact ? "sm" : "default"}
      onClick={() => void handleReset()}
    >
      <RotateCcwIcon data-icon="inline-start" />
      Reset cache dev
    </Button>
  );
}
