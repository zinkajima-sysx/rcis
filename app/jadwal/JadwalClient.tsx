'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, List, Search, Filter, X, Plus, Edit2, Trash2 } from 'lucide-react';

import { createJadwal, deleteJadwal, updateJadwal } from './actions';
import type { PermissionSet } from '@/lib/permissions';

type JadwalItem = {
  id: string;
  kode: string;
  title: string;
  date: string;
  location: string;
  daop: string;
  status: string;
};

function formatDateLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function JadwalClient({
  initialEvents,
  daopList,
  permissions,
}: {
  initialEvents: JadwalItem[];
  daopList: string[];
  permissions: PermissionSet;
}) {
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<JadwalItem | null>(null);
  const [events, setEvents] = useState(initialEvents);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({
    id: '',
    kode: '',
    title: '',
    date: '',
    location: '',
    daop: daopList[0] ?? '',
    status: 'Akan Datang',
  });
  const [tableSearch, setTableSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const resolvedDaopList = useMemo(() => {
    const merged = new Set<string>([...daopList, ...events.map((item) => item.daop)]);
    return Array.from(merged).filter(Boolean).sort((left, right) => left.localeCompare(right));
  }, [daopList, events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const emptyDaysPrefix = Array.from({ length: firstDayOfMonth }).map(() => null);
  const daysArray = Array.from({ length: daysInMonth }).map((_, index) => index + 1);
  const totalSlots = emptyDaysPrefix.length + daysArray.length;
  const emptyDaysSuffix = Array.from({ length: totalSlots % 7 !== 0 ? 7 - (totalSlots % 7) : 0 }).map(() => null);
  const calendarCells = [...emptyDaysPrefix, ...daysArray, ...emptyDaysSuffix];

  const filteredTableEvents = events.filter((event) => {
    const keyword = tableSearch.toLowerCase();
    return (
      event.title.toLowerCase().includes(keyword) ||
      event.location.toLowerCase().includes(keyword) ||
      event.daop.toLowerCase().includes(keyword) ||
      event.kode.toLowerCase().includes(keyword)
    );
  });

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((event) => event.date === dateStr);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Berlangsung':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Akan Datang':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const openAddForm = (presetDate?: string) => {
    setFormMode('add');
    setFormData({
      id: '',
      kode: '',
      title: '',
      date: presetDate ?? '',
      location: '',
      daop: resolvedDaopList[0] ?? '',
      status: 'Akan Datang',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (event: JadwalItem) => {
    setFormMode('edit');
    setFormData(event);
    setIsFormOpen(true);
    setSelectedEvent(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteJadwal(id);

      if (result.success) {
        setEvents(events.filter((event) => event.id !== id));
        setSelectedEvent(null);
        return;
      }

      alert(result.error);
    });
  };

  const handleSaveForm = (event: React.FormEvent) => {
    event.preventDefault();

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('date', formData.date);
    payload.append('location', formData.location);
    payload.append('daop', formData.daop);
    payload.append('status', formData.status);

    startTransition(async () => {
      const result = formMode === 'add' ? await createJadwal(payload) : await updateJadwal(formData.id, payload);

      if (!result.success || !result.data) {
        alert(result.error);
        return;
      }

      if (formMode === 'add') {
        setEvents([...events, result.data]);
      } else {
        setEvents(events.map((item) => (item.id === formData.id ? result.data : item)));
      }

      setIsFormOpen(false);
    });
  };

  const today = new Date();

  return (
    <>
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Jadwal Rail Clinic</h1>
          <p className="text-slate-400 text-sm mt-1">Pantau jadwal kegiatan Rail Clinic yang tersimpan di database.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-1 bg-slate-900 border border-white/10 p-1 rounded-lg">
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 text-sm rounded-md font-medium flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
              <CalendarIcon size={16} /> Kalender
            </button>
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 text-sm rounded-md font-medium flex items-center gap-2 ${viewMode === 'table' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
              <List size={16} /> Tabel
            </button>
          </div>
          {permissions.c && (
            <button onClick={() => openAddForm()} className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Tambah Jadwal
            </button>
          )}
        </div>
      </header>

      {viewMode === 'calendar' ? (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
          <div className="flex-[2] bg-slate-800 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800/80 shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-slate-50 w-44">{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h2>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 bg-slate-900 border border-white/5"><ChevronLeft size={18} /></button>
                  <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 bg-slate-900 border border-white/5"><ChevronRight size={18} /></button>
                </div>
              </div>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium border border-white/10 rounded-lg text-slate-300 hover:bg-white/5 bg-slate-900">Bulan Ini</button>
            </div>

            <div className="flex-1 flex flex-col p-4 bg-slate-900/50 min-h-0">
              <div className="grid grid-cols-7 gap-px mb-2 shrink-0">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-[minmax(90px,1fr)] overflow-y-auto custom-scrollbar">
                {calendarCells.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="bg-slate-800/30 rounded-xl p-2 min-h-[90px] border border-transparent"></div>;
                  }

                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const dayEvents = getEventsForDay(day);
                  const presetDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                  return (
                    <div key={`day-${day}`} className={`rounded-xl p-2 min-h-[90px] border ${isToday ? 'bg-sky-500/5 border-sky-500/30 ring-1 ring-sky-500/20' : 'bg-slate-800 border-white/5 hover:border-white/20'} flex flex-col overflow-hidden transition-all group relative`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-500 text-slate-950' : 'text-slate-400 group-hover:text-slate-200'}`}>{day}</div>
                        {permissions.c && <button onClick={(event) => { event.stopPropagation(); openAddForm(presetDate); }} className="bg-white/5 hover:bg-white/10 text-slate-300 p-1 rounded opacity-0 group-hover:opacity-100">
                          <Plus size={12} />
                        </button>}
                      </div>
                      <div className="flex flex-col gap-1 mt-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {dayEvents.map((item) => (
                          <button key={item.id} onClick={() => setSelectedEvent(item)} className={`text-left text-[10px] p-1.5 rounded font-medium truncate border hover:opacity-80 cursor-pointer ${getStatusBadge(item.status)}`}>
                            <div className="truncate font-bold mb-0.5">{item.daop}</div>
                            <div className="truncate opacity-90">{item.title}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 lg:max-w-sm bg-slate-800 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-slate-800/80">
              <h2 className="text-base font-bold text-slate-50 flex items-center gap-2"><Clock size={18} className="text-sky-400" /> Agenda Mendatang</h2>
            </div>
            <div className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
              {events
                .filter((item) => item.status !== 'Selesai')
                .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
                .map((item) => (
                  <div key={`${item.id}-agenda`} className={`p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden border cursor-pointer hover:bg-slate-800 ${item.status === 'Berlangsung' ? 'bg-slate-900/80 border-sky-500/20' : 'bg-slate-900/50 border-white/5 hover:border-white/10'}`} onClick={() => setSelectedEvent(item)}>
                    {item.status === 'Berlangsung' && <div className="absolute left-0 top-0 w-1 h-full bg-sky-500"></div>}
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-slate-50 text-sm line-clamp-2 leading-tight">{item.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border shrink-0 ${getStatusBadge(item.status)}`}>{item.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">{item.date}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin size={14} className="text-slate-500" /> {item.location} ({item.daop})
                    </div>
                  </div>
                ))}
              {events.filter((item) => item.status !== 'Selesai').length === 0 && (
                <div className="text-center text-sm text-slate-500 py-10 border border-dashed border-white/10 rounded-xl bg-slate-900/20">Tidak ada jadwal mendatang.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-white/10 flex flex-col flex-1 overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/80 shrink-0 gap-4 flex-wrap">
            <div className="relative max-w-sm w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Cari kegiatan, lokasi, wilayah, atau kode..." value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 " />
            </div>
            <button className="bg-slate-900 border border-white/10 text-slate-300 px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/5 ">
              <Filter size={16} /> {filteredTableEvents.length} Jadwal
            </button>
          </div>

          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/50">
                  <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Kode & Kegiatan</th>
                  <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Tanggal</th>
                  <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Lokasi Daop</th>
                  <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Status</th>
                  <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTableEvents.length > 0 ? filteredTableEvents.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 group">
                    <td className="py-3.5 px-5">
                      <div className="text-sm font-semibold text-slate-50">{item.title}</div>
                      <div className="text-xs text-sky-400 font-mono mt-0.5">{item.kode}</div>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-300 font-medium">{item.date}</td>
                    <td className="py-3.5 px-5">
                      <div className="text-sm text-slate-300">{item.location}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.daop}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusBadge(item.status)}`}>{item.status}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedEvent(item)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg border border-transparent hover:border-white/10"><Search size={16} /></button>
                        {permissions.u && <button onClick={() => openEditForm(item)} className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg border border-transparent hover:border-sky-400/20"><Edit2 size={16} /></button>}
                        {permissions.d && <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg border border-transparent hover:border-rose-400/20"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-slate-500">Belum ada jadwal di database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 pb-4 border-b border-white/10 flex justify-between items-start bg-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border inline-block ${getStatusBadge(selectedEvent.status)}`}>{selectedEvent.status}</span>
                  <div className="flex gap-1.5">
                    {permissions.u && <button onClick={() => openEditForm(selectedEvent)} className="p-1.5 bg-slate-900 border border-white/5 hover:bg-white/10 rounded-md text-slate-400 hover:text-sky-400 " title="Edit Data"><Edit2 size={14} /></button>}
                    {permissions.d && <button onClick={() => handleDelete(selectedEvent.id)} className="p-1.5 bg-slate-900 border border-white/5 hover:bg-white/10 rounded-md text-slate-400 hover:text-rose-400 " title="Hapus Data"><Trash2 size={14} /></button>}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-50 leading-tight">{selectedEvent.title}</h2>
                <div className="text-sm text-sky-400 font-mono mt-1">{selectedEvent.kode}</div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-100 bg-white/5 p-1 rounded-md"><X size={18} /></button>
            </div>
            <div className="p-6 bg-slate-900/50 flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-slate-900 border border-white/5 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Tanggal Acara</div>
                  <div className="text-sm font-semibold text-slate-200">{formatDateLabel(selectedEvent.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-900 border border-white/5 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Lokasi Pelaksanaan</div>
                  <div className="text-sm font-semibold text-slate-200">{selectedEvent.location}</div>
                  <div className="text-xs text-slate-400">{selectedEvent.daop}</div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex gap-3 shrink-0 bg-slate-800">
              <button onClick={() => setSelectedEvent(null)} className="flex-1 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 ">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveForm} className="bg-slate-800 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-slate-50">{formMode === 'add' ? 'Tambah Jadwal RC' : 'Edit Jadwal RC'}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-100 bg-white/5 p-1 rounded-md"><X size={18} /></button>
            </div>
            <div className="p-6 bg-slate-900/50 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {formMode === 'edit' && (
                <div className="text-xs font-mono text-slate-500 bg-slate-900 border border-white/5 p-2 rounded-lg text-center mb-2">
                  Kode Acara: <span className="text-sky-400">{formData.kode}</span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Tema Kegiatan <span className="text-rose-400">*</span></label>
                <input required type="text" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder="Contoh: Baksos Rail Clinic Gen 4..." className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 " />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Tanggal Pelaksanaan <span className="text-rose-400">*</span></label>
                <input required type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 [color-scheme:dark]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Wilayah Daop <span className="text-rose-400">*</span></label>
                  <select required value={formData.daop} onChange={(event) => setFormData({ ...formData, daop: event.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 ">
                    {resolvedDaopList.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Stasiun (Lokasi) <span className="text-rose-400">*</span></label>
                  <input required type="text" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} placeholder="Stasiun..." className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 " />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Status <span className="text-rose-400">*</span></label>
                <select required value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className={`w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none appearance-none font-semibold ${formData.status === 'Selesai' ? 'text-emerald-400 focus:border-emerald-500' : formData.status === 'Berlangsung' ? 'text-sky-400 focus:border-sky-500' : 'text-amber-400 focus:border-amber-500'}`}>
                  <option value="Akan Datang" className="text-amber-400 font-semibold">Akan Datang</option>
                  <option value="Berlangsung" className="text-sky-400 font-semibold">Berlangsung</option>
                  <option value="Selesai" className="text-emerald-400 font-semibold">Selesai</option>
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-slate-800">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 ">Batal</button>
              <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-600 shadow-sm disabled:opacity-50">
                {isPending ? 'Menyimpan...' : formMode === 'add' ? 'Simpan Baru' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
