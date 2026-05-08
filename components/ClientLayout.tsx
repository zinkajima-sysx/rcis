'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { ModuleKey } from '@/lib/permissions';
import { 
 LayoutDashboard, 
 Image as ImageIcon, 
 Stethoscope, 
 Handshake, 
 CalendarDays, 
 Users, 
 Map as MapIcon, 
 Shield, 
 Tags, 
 Menu,
 X,
 ChevronLeft,
 ChevronRight,
 ShieldCheck,
 LogOut
} from 'lucide-react';

interface User {
  userId: string;
  nip?: string;
  username?: string;
  nama: string;
  hak_akses: any;
}

type NavLink = {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  module: ModuleKey;
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const isAuthRoute = pathname === '/login';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  }, []);

  useEffect(() => {
    if (isAuthRoute) {
      return;
    }

    // Fetch current user
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    };

    fetchUser();
  }, [isAuthRoute]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      setUser(null);
      window.location.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      window.location.replace('/login');
    }
  };

  const canRead = (moduleName: ModuleKey) => Boolean(user?.hak_akses?.[moduleName]?.r);

  const navLinks: NavLink[] = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', module: 'Dashboard' },
    { href: '/galeri', icon: ImageIcon, label: 'Galeri Kegiatan', module: 'Galeri' },
    { href: '/alkes', icon: Stethoscope, label: 'Alkes (Inventaris)', module: 'Alkes' },
    { href: '/handover', icon: Handshake, label: 'Handover', module: 'Handover' },
    { href: '/jadwal', icon: CalendarDays, label: 'Jadwal RC', module: 'JadwalRC' },
  ];

  const masterLinks: NavLink[] = [
    { href: '/master/users', icon: Users, label: 'Manajemen User', module: 'ManajemenUser' },
    { href: '/master/daop', icon: MapIcon, label: 'Daop / Divre', module: 'DaopDivre' },
    { href: '/master/entitas', icon: Shield, label: 'Entitas', module: 'Entitas' },
    { href: '/master/kategori', icon: Tags, label: 'Kategori Alkes', module: 'KategoriAlkes' },
    { href: '/master/setting-crud', icon: ShieldCheck, label: 'Setting CRUD', module: 'SettingCRUD' },
  ];

  const visibleNavLinks = navLinks.filter((link) => canRead(link.module));
  const visibleMasterLinks = masterLinks.filter((link) => canRead(link.module));

  return (
    <div className="min-h-screen h-[100dvh] overflow-hidden bg-slate-100 lg:flex">
      <div className="lg:hidden fixed left-0 top-0 w-full h-16 bg-white border-b border-white/10 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1">
            <Image src="/logorcis.png" alt="RCIS Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">RCIS</span>
        </div>
        <div className="relative flex items-center gap-3">
          {user && (
            <button
              type="button"
              aria-label="Buka menu user"
              aria-expanded={isUserMenuOpen}
              onClick={() => {
                setIsMobileOpen(false);
                setIsUserMenuOpen((value) => !value);
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            >
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold text-slate-800">{user.nama}</div>
                <div className="text-xs text-sky-400">{user.nip ?? user.username}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center font-bold text-sky-400 shadow-sm">
                {(user.nama ?? 'RC').slice(0, 2).toUpperCase()}
              </div>
            </button>
          )}

          {user && isUserMenuOpen && (
            <div className="absolute right-0 top-[52px] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-50">
              <button
                type="button"
                aria-label="Logout"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <LogOut size={18} className="shrink-0" />
                Logout
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label="Buka menu navigasi"
            onClick={() => {
              setIsUserMenuOpen(false);
              setIsMobileOpen(true);
            }}
            className="text-slate-700 hover:text-white p-2 bg-white/5 rounded-lg border border-white/10 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <aside className={`
        fixed lg:relative top-0 left-0 h-screen h-[100dvh] shrink-0 bg-white border-r border-white/10 z-50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[88px] w-[260px]' : 'lg:w-[260px] w-[260px]'}
      `}>
        <div className="absolute top-4 right-4 lg:hidden">
            <button
              type="button"
              aria-label="Tutup menu navigasi"
              onClick={() => setIsMobileOpen(false)}
              className="text-slate-600 hover:text-white p-1.5 bg-slate-50/50 rounded-lg backdrop-blur-sm border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            >
                <X size={20} />
            </button>
        </div>

        <div className={`p-6 shrink-0 transition-all duration-300 ${isCollapsed ? 'lg:px-4 lg:pb-4 lg:pt-6' : ''}`}>
          <div className={`flex items-center justify-center bg-white rounded-xl shadow-md transition-all duration-300 relative w-full ${isCollapsed ? 'min-h-[80px] p-3 lg:h-12 lg:min-h-0 lg:p-1.5' : 'p-3 min-h-[80px]'}`}>
            <Image src="/logorcis.png" alt="RCIS Logo" fill className={`object-contain transition-all duration-300 ${isCollapsed ? 'p-1' : 'p-2'}`} priority />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pb-6 flex flex-col gap-1">
          {visibleNavLinks.map((link) => {
             const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
             return (
              <Link 
                key={link.href} 
                href={link.href} 
                title={link.label}
                className={`
                  flex items-center gap-3 py-3 rounded-lg text-sm font-semibold transition-colors relative group
                  ${isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4'}
                  ${isActive ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[inset_0_0_12px_rgba(14,165,233,0.1)]' : 'text-slate-600 hover:text-slate-800 hover:bg-white/5 border border-transparent'}
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800
                `}
              >
                <link.icon size={20} className={`shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-700'}`} />
                <span className={`truncate transition-all duration-300 ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden block' : 'w-auto opacity-100'}`}>
                  {link.label}
                </span>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                    <div className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                        {link.label}
                        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-100 rotate-45 border-l border-b border-white/10"></div>
                    </div>
                )}
              </Link>
          )})}

          {visibleMasterLinks.length > 0 && (
            <div className={`mt-8 mb-2 px-2 text-xs font-bold text-slate-500 tracking-wider whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'lg:text-[10px] lg:text-center' : ''}`}>
               {isCollapsed ? <span className="hidden lg:inline">MASTER</span> : 'DATA MASTER'}
               <span className="lg:hidden block">DATA MASTER</span>
            </div>
          )}

          {visibleMasterLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href);
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                title={link.label}
                className={`
                  flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group
                  ${isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4'}
                  ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]' : 'text-slate-600 hover:text-slate-800 hover:bg-white/5 border border-transparent'}
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800
                `}
              >
                <link.icon size={18} className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-700'}`} />
                <span className={`truncate transition-all duration-300 ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden block' : 'w-auto opacity-100'}`}>
                  {link.label}
                </span>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                    <div className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                        {link.label}
                        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-100 rotate-45 border-l border-b border-white/10"></div>
                    </div>
                )}
              </Link>
          )})}

          {/* Logout Button */}
          {user && (
            <button
              type="button"
              aria-label="Logout"
              onClick={handleLogout}
              className={`
                hidden lg:flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group mt-4
                ${isCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4'}
                text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800
              `}
            >
              <LogOut size={18} className="shrink-0" />
              <span className={`truncate transition-all duration-300 ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden block' : 'w-auto opacity-100'}`}>
                Logout
              </span>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                  Logout
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-slate-100 rotate-45 border-l border-b border-white/10"></div>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Sidebar Toggle Button for Desktop */}
        <div className="hidden lg:flex p-4 border-t border-white/10">
           <button 
             type="button"
             aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
             onClick={() => setIsCollapsed(!isCollapsed)} 
             className="w-full flex items-center justify-center py-2 px-3 bg-slate-50/50 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg border border-white/5 hover:border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
           >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
           </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <button
        type="button"
        aria-label="Tutup menu navigasi"
        className={`lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen || isUserMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {
          setIsMobileOpen(false);
          setIsUserMenuOpen(false);
        }}
      />

      <nav aria-label="Navigasi utama" className="lg:hidden fixed left-0 right-0 bottom-0 z-40 px-4 pb-4">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-xl px-2 py-2">
          <div className="flex items-stretch justify-between gap-1">
            {visibleNavLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${
                    isActive ? 'bg-sky-500/10 text-sky-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <link.icon size={20} className={isActive ? 'text-sky-600' : 'text-slate-500'} />
                  <span className="truncate max-w-[64px]">{link.label.replace(' (Inventaris)', '')}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="relative flex min-h-0 flex-1 flex-col h-screen h-[100dvh] overflow-hidden bg-slate-100 pt-16 pb-24 lg:pt-0 lg:pb-0 transition-all duration-300 min-w-0">
        {children}
      </div>
    </div>
  )
}
