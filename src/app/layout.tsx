import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppFrame } from "@/components/app-frame";
import { AuthProvider } from "@/components/auth-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    apple: "/apple-icon",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
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
