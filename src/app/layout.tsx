import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AppFrame } from "@/components/app-frame";
import { AuthProvider } from "@/components/auth-provider";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Rail Clinic Inventory",
    template: "%s | Rail Clinic Inventory",
  },
  description:
    "Platform inventaris alat kesehatan Rail Clinic PT KAI dengan dashboard kalibrasi, galeri kegiatan, dan pengalaman PWA.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RCI PT KAI",
  },
  icons: {
    icon: "/appicon.png",
    apple: "/appicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b4ea2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <AuthProvider>
          <AppFrame>{children}</AppFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
