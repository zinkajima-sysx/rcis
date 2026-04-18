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
        src: "/appicon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/appicon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/appicon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
