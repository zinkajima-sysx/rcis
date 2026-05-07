import React from 'react';
import { Activity, CalendarDays, Image as ImageIcon, PackageCheck, Stethoscope, UserRound, XOctagon } from 'lucide-react';
import { count, eq } from 'drizzle-orm';

import { getUser } from '@/lib/auth';
import { formatDateIndonesia, getDaysUntilDate, getTodayStart } from '@/lib/date-id';
import { db } from '@/lib/db';
import { galeri, handover, jadwalRC, users } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

function formatDateLabel(date: Date) {
  return formatDateIndonesia(date);
}

function classifyKondisi(kondisi: string) {
  const normalized = kondisi.toLowerCase();

  if (normalized.includes('rusak') || normalized.includes('tidak layak')) {
    return 'rusak';
  }

  if (normalized.includes('perbaikan') || normalized.includes('butuh') || normalized.includes('ringan')) {
    return 'perbaikan';
  }

  return 'layak';
}

export default async function Page() {
  const currentUser = await getUser();
  const isSuperadmin = String((currentUser?.entitas as { nama?: string } | null)?.nama ?? '').trim().toLowerCase() === 'superadmin';
  const today = getTodayStart();
  const [
    alkesSummary,
    totalGaleri,
    totalHandover,
    userSummary,
    jadwalBerlangsung,
    jadwalAkanDatang,
    jadwalSelesai,
    currentSchedule,
    upcomingSchedules,
    latestAlkes,
  ] = await Promise.all([
    db.query.alkes.findMany({
      columns: { id: true, kondisi: true, nama: true, kode: true, jadwalKalibrasi: true },
    }),
    db.select({ value: count() }).from(galeri).then(([row]) => row.value),
    db.select({ value: count() }).from(handover).then(([row]) => row.value),
    db.query.users.findMany({
      columns: { id: true },
      with: {
        entitas: {
          columns: {
            nama: true,
          },
        },
      },
    }),
    db.select({ value: count() }).from(jadwalRC).where(eq(jadwalRC.status, 'Berlangsung')).then(([row]) => row.value),
    db.select({ value: count() }).from(jadwalRC).where(eq(jadwalRC.status, 'Akan Datang')).then(([row]) => row.value),
    db.select({ value: count() }).from(jadwalRC).where(eq(jadwalRC.status, 'Selesai')).then(([row]) => row.value),
    db.query.jadwalRC.findFirst({
      where: (jadwalRC, { eq }) => eq(jadwalRC.status, 'Berlangsung'),
      orderBy: (jadwalRC, { asc }) => [asc(jadwalRC.date)],
    }),
    db.query.jadwalRC.findMany({
      where: (jadwalRC, { eq }) => eq(jadwalRC.status, 'Akan Datang'),
      orderBy: (jadwalRC, { asc }) => [asc(jadwalRC.date)],
      limit: 3,
    }),
    db.query.alkes.findMany({
      with: {
        kategori: true,
      },
      orderBy: (alkes, { desc }) => [desc(alkes.createdAt)],
      limit: 5,
    }),
  ]);
  const totalUsers = isSuperadmin
    ? userSummary.length
    : userSummary.filter((item) => item.entitas.nama.trim().toLowerCase() !== 'superadmin').length;
  const dashboardGeneratedAt = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());

  const kondisiStats = alkesSummary.reduce(
    (accumulator, item) => {
      accumulator[classifyKondisi(item.kondisi)] += 1;
      return accumulator;
    },
    { layak: 0, perbaikan: 0, rusak: 0 },
  );

  const alkesTanpaKalibrasi = alkesSummary.filter((item) => item.jadwalKalibrasi === null);

  const alkesKalibrasiTerdekat = alkesSummary
    .filter((item) => item.jadwalKalibrasi !== null)
    .map((item) => ({
      ...item,
      selisihHari: getDaysUntilDate(item.jadwalKalibrasi, today),
    }))
    .filter((item) => item.selisihHari !== null && item.selisihHari >= 0 && item.selisihHari <= 30)
    .sort((left, right) => (left.selisihHari ?? 0) - (right.selisihHari ?? 0));

  const alkesLewatKalibrasi = alkesSummary
    .filter((item) => item.jadwalKalibrasi !== null)
    .map((item) => ({
      ...item,
      selisihHari: getDaysUntilDate(item.jadwalKalibrasi, today),
    }))
    .filter((item) => item.selisihHari !== null && item.selisihHari < 0)
    .sort((left, right) => (left.selisihHari ?? 0) - (right.selisihHari ?? 0));

  return (
    <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto no-scrollbar w-full">
      <header className="flex justify-between items-center shrink-0 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard RCIS</h1>
          <p className="text-slate-600 text-sm mt-1">Ringkasan aplikasi berdasarkan data real yang tersimpan di database.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Live Database</div>
            <div className="text-xs text-emerald-200">NeonDB terkoneksi • {dashboardGeneratedAt}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800">{currentUser?.nama ?? 'Pengguna RCIS'}</div>
            <div className="text-xs text-sky-400">{currentUser?.nip ?? 'Belum login'}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center font-bold text-sky-400 shadow-sm">
            {(currentUser?.nama ?? 'RC').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Ringkasan Inventaris</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-sky-50/60 p-5 rounded-2xl border border-sky-100 flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="text-xs text-sky-700 uppercase tracking-widest mb-1 font-semibold">Total Alkes</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{alkesSummary.length}</div>
            <Stethoscope className="absolute right-4 bottom-4 text-sky-400/20 group-hover:scale-110 transition-transform duration-300" size={48} />
          </div>
          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="text-xs text-emerald-700 uppercase tracking-widest mb-1 font-semibold">Layak Pakai</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{kondisiStats.layak}</div>
            <Activity className="absolute right-4 bottom-4 text-emerald-400/20 group-hover:scale-110 transition-transform duration-300" size={48} />
          </div>
          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="text-xs text-amber-700 uppercase tracking-widest mb-1 font-semibold">Butuh Perbaikan</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{kondisiStats.perbaikan}</div>
            <PackageCheck className="absolute right-4 bottom-4 text-amber-400/20 group-hover:scale-110 transition-transform duration-300" size={48} />
          </div>
          <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="text-xs text-rose-700 uppercase tracking-widest mb-1 font-semibold">Rusak / Tidak Layak</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{kondisiStats.rusak}</div>
            <XOctagon className="absolute right-4 bottom-4 text-rose-400/20 group-hover:scale-110 transition-transform duration-300" size={48} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Statistik Modul</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100/70 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
            <div>
              <div className="text-xs text-pink-700 font-semibold">Galeri Tersimpan</div>
              <div className="text-2xl font-bold text-pink-600 mt-1">{totalGaleri}</div>
            </div>
            <ImageIcon className="text-pink-400/40 group-hover:scale-110 transition-transform duration-300" size={24} />
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
            <div>
              <div className="text-xs text-slate-600 font-semibold">Handover Tersimpan</div>
              <div className="text-2xl font-bold text-slate-700 mt-1">{totalHandover}</div>
            </div>
            <PackageCheck className="text-slate-400/40 group-hover:scale-110 transition-transform duration-300" size={24} />
          </div>
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/70 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
            <div>
              <div className="text-xs text-indigo-700 font-semibold">User Aktif Sistem</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{totalUsers}</div>
            </div>
            <UserRound className="text-indigo-400/40 group-hover:scale-110 transition-transform duration-300" size={24} />
          </div>
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/70 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
            <div>
              <div className="text-xs text-amber-700 font-semibold">Jadwal Selesai</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{jadwalSelesai}</div>
            </div>
            <CalendarDays className="text-amber-400/40 group-hover:scale-110 transition-transform duration-300" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 mt-2">
        <div className="bg-white p-5 rounded-2xl border border-white/10 flex flex-col justify-center shadow-sm">
          <div className="text-xs text-slate-600 uppercase tracking-widest mb-1 font-medium">Kegiatan Sedang Berlangsung</div>
          {currentSchedule ? (
            <>
              <div className="text-lg font-semibold text-slate-900 mt-1">{currentSchedule.title}</div>
              <div className="text-sm text-sky-400 mt-1 flex items-center gap-2 font-medium">
                <CalendarDays size={16} /> {formatDateLabel(currentSchedule.date)} ({currentSchedule.location})
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-600 mt-1">Belum ada kegiatan dengan status berlangsung.</div>
          )}
        </div>
        <div className="bg-white p-5 rounded-2xl border border-white/10 flex flex-col shadow-sm">
          <div className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-medium">Ringkasan Status Jadwal</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50/50 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-slate-600">Berlangsung</div>
              <div className="text-xl font-bold text-sky-400 mt-1">{jadwalBerlangsung}</div>
            </div>
            <div className="bg-slate-50/50 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-slate-600">Akan Datang</div>
              <div className="text-xl font-bold text-amber-400 mt-1">{jadwalAkanDatang}</div>
            </div>
            <div className="bg-slate-50/50 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-slate-600">Selesai</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{jadwalSelesai}</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Monitoring Kalibrasi Alkes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-white/50 p-4 rounded-xl border border-amber-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 font-medium">Mendekati Jadwal Kalibrasi</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{alkesKalibrasiTerdekat.length}</div>
              <div className="text-xs text-slate-500 mt-1">Maksimal 30 hari ke depan</div>
            </div>
            <CalendarDays className="text-amber-500/40" size={24} />
          </div>
          <div className="bg-white/50 p-4 rounded-xl border border-rose-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-600 font-medium">Lewat Masa Kalibrasi</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{alkesLewatKalibrasi.length}</div>
              <div className="text-xs text-slate-500 mt-1">Perlu tindak lanjut segera</div>
            </div>
            <XOctagon className="text-rose-500/40" size={24} />
          </div>
          <div className="bg-white/50 p-4 rounded-xl border border-slate-400/20 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-slate-600 font-medium">Tanpa Kalibrasi</div>
              <div className="text-2xl font-bold text-slate-700 mt-1">{alkesTanpaKalibrasi.length}</div>
              <div className="text-xs text-slate-500 mt-1">Tidak masuk monitoring jadwal</div>
            </div>
            <Stethoscope className="text-slate-500/40" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-white/10 flex flex-col overflow-hidden min-h-[280px] shadow-md">
          <div className="p-5 border-b border-white/10 shrink-0">
            <h2 className="font-semibold text-slate-900 text-base">Jadwal Berikutnya</h2>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {upcomingSchedules.length > 0 ? upcomingSchedules.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-50/50 border border-white/5">
                <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                <div className="text-xs text-slate-600 mt-1">{formatDateLabel(item.date)}</div>
                <div className="text-xs text-sky-400 mt-1">{item.location} ({item.daop})</div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">Belum ada jadwal mendatang di database.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-white/10 flex flex-col overflow-hidden min-h-[280px] shadow-md">
          <div className="p-5 border-b border-white/10 shrink-0">
            <h2 className="font-semibold text-slate-900 text-base">Alkes Terbaru</h2>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/10 bg-white/50">
                  <th className="py-4 px-5 text-xs text-slate-600 uppercase tracking-wider font-semibold">Kode</th>
                  <th className="py-4 px-5 text-xs text-slate-600 uppercase tracking-wider font-semibold">Nama Alat</th>
                  <th className="py-4 px-5 text-xs text-slate-600 uppercase tracking-wider font-semibold">Kategori</th>
                  <th className="py-4 px-5 text-xs text-slate-600 uppercase tracking-wider font-semibold">Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {latestAlkes.length > 0 ? latestAlkes.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5">
                    <td className="py-3.5 px-5 text-sm font-mono text-sky-400">{item.kode}</td>
                    <td className="py-3.5 px-5 text-sm font-semibold text-slate-900">{item.nama}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-700">{item.kategori.nama}</td>
                    <td className="py-3.5 px-5 text-sm text-slate-600">
                      {item.kondisi}
                      {item.jadwalKalibrasi === null ? ' • Tanpa kalibrasi' : ''}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-slate-500">Belum ada data alkes di database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-white/10 flex flex-col overflow-hidden min-h-[280px] shadow-md">
          <div className="p-5 border-b border-white/10 shrink-0">
            <h2 className="font-semibold text-slate-900 text-base">Alkes Mendekati Kalibrasi</h2>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {alkesKalibrasiTerdekat.length > 0 ? alkesKalibrasiTerdekat.slice(0, 5).map((item) => (
              <div key={`${item.id}-near`} className="p-4 rounded-xl bg-slate-50/50 border border-amber-500/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{item.nama}</div>
                    <div className="text-xs text-sky-400 font-mono mt-1">{item.kode}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-amber-500/10 text-amber-400 border-amber-500/20">
                    {item.selisihHari} hari lagi
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-2">Jadwal kalibrasi: {formatDateIndonesia(item.jadwalKalibrasi)}</div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">Belum ada alkes dengan jadwal kalibrasi dalam 30 hari ke depan.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-white/10 flex flex-col overflow-hidden min-h-[280px] shadow-md">
          <div className="p-5 border-b border-white/10 shrink-0">
            <h2 className="font-semibold text-slate-900 text-base">Alkes Lewat Kalibrasi</h2>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {alkesLewatKalibrasi.length > 0 ? alkesLewatKalibrasi.slice(0, 5).map((item) => (
              <div key={`${item.id}-overdue`} className="p-4 rounded-xl bg-slate-50/50 border border-rose-500/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{item.nama}</div>
                    <div className="text-xs text-sky-400 font-mono mt-1">{item.kode}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-rose-500/10 text-rose-400 border-rose-500/20">
                    Lewat {Math.abs(item.selisihHari ?? 0)} hari
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-2">Jadwal kalibrasi: {formatDateIndonesia(item.jadwalKalibrasi)}</div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">Belum ada alkes yang melewati masa kalibrasi.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
