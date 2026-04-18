"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { DownloadIcon, SmartphoneIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function InstallPromptButton() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches
    );
  });

  const registerServiceWorker = useEffectEvent(async () => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (
      process.env.NODE_ENV !== "production" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );

      return;
    }

    await navigator.serviceWorker.register("/sw.js");
  });

  useEffect(() => {
    void registerServiceWorker();

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstalled(true);
    }

    setPromptEvent(null);
  };

  if (installed) {
    return (
      <Button variant="outline">
        <SmartphoneIcon data-icon="inline-start" />
        Sudah terpasang
      </Button>
    );
  }

  if (!promptEvent) {
    return (
      <Button variant="outline">
        <DownloadIcon data-icon="inline-start" />
        Siap diinstal
      </Button>
    );
  }

  return (
    <Button onClick={() => void handleInstall()}>
      <DownloadIcon data-icon="inline-start" />
      Install aplikasi
    </Button>
  );
}
