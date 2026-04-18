import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rail Clinic Inventory",
    short_name: "RCI PT KAI",
    description:
      "Aplikasi PWA untuk inventaris alat kesehatan, kalibrasi, dan galeri kegiatan Rail Clinic PT KAI.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f9fd",
    theme_color: "#0b4ea2",
    orientation: "portrait-primary",
    lang: "id-ID",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/maskable-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
