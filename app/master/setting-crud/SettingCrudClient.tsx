'use client';

import React, { useState, useTransition } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

import { buildEntitasHakAkses, MODULES, type HakAkses, type ModuleKey, type PermissionKey, type PermissionSet } from '@/lib/permissions';

import { resetEntitasPermissions, updateEntitasPermission } from './actions';

type EntitasRow = {
  id: string;
  kode: string;
  entitas: string;
  hak_akses: HakAkses;
};

export default function SettingCrudClient({ initialData }: { initialData: EntitasRow[] }) {
  const [data, setData] = useState(initialData);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggle = (entitasId: string, modul: ModuleKey, permissionKey: PermissionKey, nextValue: boolean) => {
    startTransition(async () => {
      const result = await updateEntitasPermission(entitasId, modul, permissionKey, nextValue);

      if (!result.success) {
        showToast(result.error || 'Gagal menyimpan hak akses.');
        return;
      }

      setData((prevData) =>
        prevData.map((item) =>
          item.id === entitasId
            ? {
                ...item,
                hak_akses: {
                  ...item.hak_akses,
                  [modul]: {
                    ...item.hak_akses[modul],
                    [permissionKey]: nextValue,
                  },
                },
              }
            : item,
        ),
      );
      showToast(`Hak akses ${permissionKey.toUpperCase()} untuk ${modul} berhasil disimpan.`);
    });
  };

  const handleReset = () => {
    if (!window.confirm('Yakin ingin mereset seluruh hak akses ke preset default sesuai entitas?')) {
      return;
    }

    startTransition(async () => {
      const result = await resetEntitasPermissions();

      if (!result.success) {
        showToast(result.error || 'Gagal mereset hak akses.');
        return;
      }

      setData((prevData) =>
        prevData.map((item) => ({
          ...item,
          hak_akses: buildEntitasHakAkses(item.entitas),
        })),
      );
      showToast('Semua hak akses berhasil direset ke preset default.');
    });
  };

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full relative">
      <div className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="bg-emerald-500/90 backdrop-blur-md text-slate-50 px-5 py-3 rounded-xl shadow-lg border border-emerald-400/30 font-medium text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
          {toastMessage}
        </div>
      </div>

      <header className="flex justify-between items-start shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-2">
            <ShieldCheck className="text-indigo-400" /> Manajemen Hak Akses (Role Menu)
          </h1>
          <p className="text-slate-400 text-sm mt-1">Atur hak akses Create, Read, Update, Delete untuk setiap entitas terhadap modul pada sistem.</p>
        </div>
        <button onClick={handleReset} disabled={isPending} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm border border-white/5 transition-colors disabled:opacity-50">
          <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} /> Reset Default
        </button>
      </header>

      <div className="bg-slate-800 rounded-2xl border border-white/10 flex flex-col flex-1 overflow-hidden shadow-xl">
        <div className="overflow-auto flex-1 custom-scrollbar relative bg-slate-900/40">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
            <thead>
              <tr className="bg-slate-800/90 z-20 sticky top-0 border-b border-white/10">
                <th className="py-5 px-6 text-sm text-slate-300 font-bold sticky left-0 z-30 bg-slate-800/95 border-r border-white/10 w-64 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                  Modul / Menu
                </th>
                {data.map((entitas) => (
                  <th key={entitas.id} className="py-5 px-6 text-center text-sm font-semibold text-slate-300 min-w-[200px] border-r border-white/5 last:border-r-0">
                    {entitas.entitas}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MODULES.map((modul) => (
                <tr key={modul} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-6 px-6 sticky left-0 z-10 bg-slate-800/80 group-hover:bg-slate-800 border-r border-white/10 shadow-[2px_0_10px_rgba(0,0,0,0.1)]">
                    <span className="font-semibold text-slate-200 text-sm">{modul.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </td>
                  {data.map((entitas) => {
                    const permissions = entitas.hak_akses[modul] || ({ c: false, r: false, u: false, d: false } satisfies PermissionSet);
                    const isSuperadmin = entitas.entitas.toLowerCase() === 'superadmin';

                    return (
                      <td key={`${entitas.id}-${modul}`} className="py-6 px-3 border-r border-white/5 last:border-r-0 text-center">
                        <div className="flex items-center justify-center gap-4">
                          {(['c', 'r', 'u', 'd'] as const).map((permissionKey) => {
                            const isActive = permissions[permissionKey];
                            return (
                              <div key={permissionKey} className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{permissionKey}</span>
                                <button
                                  onClick={() => !isSuperadmin && handleToggle(entitas.id, modul, permissionKey, !isActive)}
                                  disabled={isPending || isSuperadmin}
                                  className={`w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${isActive ? 'bg-indigo-500' : 'bg-slate-600'} ${isSuperadmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-white/10 ring-offset-1 ring-offset-slate-900'}`}
                                >
                                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/10 bg-slate-800/90 py-4 px-6 flex justify-between items-center shrink-0">
          <div className="flex gap-6 items-center">
            <span className="text-sm font-semibold text-slate-400">Keterangan:</span>
            <div className="flex items-center gap-2">
              <div className="w-9 h-5 rounded-full bg-indigo-500 relative"><span className="absolute top-0.5 left-[18px] w-4 h-4 rounded-full bg-white"></span></div>
              <span className="text-xs text-slate-300">Diberikan Akses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-5 rounded-full bg-slate-600 relative"><span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white"></span></div>
              <span className="text-xs text-slate-300">Akses Ditolak</span>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-xs text-slate-400 font-mono"><strong className="text-slate-300">C:</strong> Create</span>
            <span className="text-xs text-slate-400 font-mono"><strong className="text-slate-300">R:</strong> Read</span>
            <span className="text-xs text-slate-400 font-mono"><strong className="text-slate-300">U:</strong> Update</span>
            <span className="text-xs text-slate-400 font-mono"><strong className="text-slate-300">D:</strong> Delete</span>
          </div>
        </div>
      </div>
    </main>
  );
}
