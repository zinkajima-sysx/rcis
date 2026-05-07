import type {Metadata, Viewport} from 'next';
import { IBM_Plex_Sans, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

const plusJakartaSans = Plus_Jakarta_Sans({
 subsets: ['latin'],
 variable: '--font-plus-jakarta-sans',
 display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
 subsets: ['latin'],
 weight: ['400', '500', '600', '700'],
 variable: '--font-ibm-plex-sans',
 display: 'swap',
});

export const metadata: Metadata = {
 title: 'RCIS - Rail Clinic Inventory System',
 description: 'Progressive Web App untuk manajemen aset dan kegiatan Rail Clinic',
 manifest: '/manifest.webmanifest',
 appleWebApp: {
   capable: true,
   statusBarStyle: 'black-translucent',
   title: 'RCIS',
 },
 icons: {
   icon: [
     { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
     { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
   ],
   apple: [
     { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
   ],
 },
};

export const viewport: Viewport = {
 themeColor: '#0f172a',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
  <html lang="id" className={`${plusJakartaSans.variable} ${ibmPlexSans.variable}`}>
  <body className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-sky-500/30 selection:text-sky-200">
    <ClientLayout>
      {children}
    </ClientLayout>
  </body>
  </html>
  );
}
