'use client';
import React, { useMemo, useRef, useState, useTransition } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Download, Edit2, Filter, LayoutGrid, List, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { createAlkes, deleteAlkes, updateAlkes } from './actions';
import { formatDateForInputIndonesia, formatDateIndonesia, getDaysUntilDate } from '@/lib/date-id';
import { uploadImageAsset } from '@/lib/uploads/client';
import type { PermissionSet } from '@/lib/permissions';

type AlkesItem = {
  id: string;
  kode: string;
  nama: string;
  jumlah: number;
  kategori: string;
  tahunPengadaan: number | null;
  kalibrasiTerakhir: string;
  jadwalKalibrasi: string;
  calibrationMode: 'required' | 'none';
  kondisi: string;
  gambarUrl?: string | null;
  keterangan?: string | null;
};

export default function AlkesClient({ initialData, permissions }: { initialData: AlkesItem[], permissions: PermissionSet }) {
  const [data, setData] = useState(initialData);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  // Form states
  const [nama, setNama] = useState('');
  const [jumlah, setJumlah] = useState('1');
  const [kategori, setKategori] = useState('Non Elektromedik');
  const [tahunPengadaan, setTahunPengadaan] = useState('');
  const [calibrationMode, setCalibrationMode] = useState<'required' | 'none'>('required');
  const [kalibrasiTerakhir, setKalibrasiTerakhir] = useState('');
  const [jadwalKalibrasi, setJadwalKalibrasi] = useState('');
  const [kondisi, setKondisi] = useState('Layak Pakai');
  const [keterangan, setKeterangan] = useState('');

  // Real Upload States
  const [file, setFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const filteredData = data.filter(d => 
    d.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calibrationSummary = useMemo(() => {
    return data.reduce(
      (accumulator, item) => {
        if (item.calibrationMode === 'none') {
          accumulator.withoutCalibration += 1;
          return accumulator;
        }

        const daysUntil = getDaysUntilDate(item.jadwalKalibrasi);

        if (daysUntil === null) {
          accumulator.withoutCalibration += 1;
        } else if (daysUntil < 0) {
          accumulator.overdue += 1;
        } else if (daysUntil <= 30) {
          accumulator.upcoming += 1;
        } else {
          accumulator.safe += 1;
        }

        return accumulator;
      },
      { upcoming: 0, overdue: 0, safe: 0, withoutCalibration: 0 },
    );
  }, [data]);

  const getBadgeStyle = (kond: string) => {
     if(!kond) return 'bg-slate-300/10 text-slate-600 border border-slate-400/20';
     if(kond.includes('Layak') || kond.includes('Baik')) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
     if(kond.includes('Rusak') || kond.includes('Buruk')) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
     return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  };

  const getPlaceholder = (kat: string) => {
     if(kat.includes('Medik')) return '/placeholder-med.jpg';
     return '/placeholder-alat.jpg'; 
  };

  const normalizeAlkesItem = (item: any): AlkesItem => ({
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    jumlah: item.jumlah ?? 0,
    kategori: item.kategori ?? 'Umum',
    tahunPengadaan: item.tahunPengadaan ?? null,
    kalibrasiTerakhir: typeof item.kalibrasiTerakhir === 'string' ? item.kalibrasiTerakhir : formatDateForInputIndonesia(item.kalibrasiTerakhir),
    jadwalKalibrasi: typeof item.jadwalKalibrasi === 'string' ? item.jadwalKalibrasi : formatDateForInputIndonesia(item.jadwalKalibrasi),
    calibrationMode: item.kalibrasiTerakhir || item.jadwalKalibrasi ? 'required' : 'none',
    kondisi: item.kondisi,
    gambarUrl: item.gambarUrl ?? '',
    keterangan: item.keterangan ?? '',
  });

  const getCalibrationBadge = (jadwal: string) => {
    const daysUntil = getDaysUntilDate(jadwal);

    if (daysUntil === null) {
      return {
        label: 'Belum diatur',
        className: 'bg-slate-300/10 text-slate-600 border border-slate-400/20',
      };
    }

    if (daysUntil < 0) {
      return {
        label: `Lewat ${Math.abs(daysUntil)} hari`,
        className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      };
    }

    if (daysUntil <= 30) {
      return {
        label: `${daysUntil} hari lagi`,
        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      };
    }

    return {
      label: 'Masih aman',
      className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    };
  };

  const resetForm = () => {
    setEditingId('');
    setNama('');
    setJumlah('1');
    setKategori('Non Elektromedik');
    setTahunPengadaan('');
    setCalibrationMode('required');
    setKalibrasiTerakhir('');
    setJadwalKalibrasi('');
    setKondisi('Layak Pakai');
    setKeterangan('');
    setFile(null);
    setExistingImage('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormMode('edit');
    setEditingId(item.id);
    setNama(item.nama);
    setJumlah(String(item.jumlah ?? 1));
    setKategori(item.kategori);
    setTahunPengadaan(String(item.tahunPengadaan ?? ''));
    setCalibrationMode(item.calibrationMode ?? (item.kalibrasiTerakhir || item.jadwalKalibrasi ? 'required' : 'none'));
    setKalibrasiTerakhir(item.kalibrasiTerakhir ?? '');
    setJadwalKalibrasi(item.jadwalKalibrasi ?? '');
    setKondisi(item.kondisi);
    setKeterangan(item.keterangan ?? '');
    setFile(null);
    setExistingImage(item.gambarUrl ?? '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'add' && !file) {
       alert("Upload foto alat kesehatan wajib diisi!");
       return;
    }

    setIsUploading(true);
    let url = existingImage;
    
    try {
      if (file) {
        const upload = await uploadImageAsset(file, {
          module: 'alkes',
          purpose: 'foto-alat',
        });
        url = upload.url;
      }
    } catch(err: any) {
      alert("Gagal upload gambar: " + err.message);
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('nama', nama);
    formData.append('jumlah', jumlah);
    formData.append('kategori', kategori);
    formData.append('tahunPengadaan', tahunPengadaan);
    formData.append('calibrationMode', calibrationMode);
    formData.append('kalibrasiTerakhir', calibrationMode === 'required' ? kalibrasiTerakhir : '');
    formData.append('jadwalKalibrasi', calibrationMode === 'required' ? jadwalKalibrasi : '');
    formData.append('kondisi', kondisi);
    formData.append('keterangan', keterangan);
    formData.append('imgUrl', url);

    startTransition(async () => {
      const res = formMode === 'add' ? await createAlkes(formData) : await updateAlkes(editingId, formData);
      setIsUploading(false);
      if (res.success && res.data) {
        const normalizedItem = normalizeAlkesItem(res.data);

        if (formMode === 'add') {
          setData([normalizedItem, ...data]);
        } else {
          setData(data.map((item) => item.id === editingId ? normalizedItem : item));
        }
        setIsModalOpen(false);
        resetForm();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Yakin hapus alat ini?')) {
      startTransition(async () => {
        const res = await deleteAlkes(id);
        if(res.success) {
           setData(data.filter(d => d.id !== id));
        } else {
           alert(res.error);
        }
      });
    }
  };

  return (
    <>
      <div className="flex justify-end -mt-14 mb-4 relative z-10 gap-3">
        <button className="bg-white hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-lg font-semibold text-sm border border-white/10 flex items-center gap-2">
          <Download size={16} /> Export
        </button>
        {permissions.c && (
          <button 
            onClick={handleOpenAdd}
            className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Tambah Alkes
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-white/10 flex flex-col flex-1 overflow-hidden min-h-[400px] shadow-md">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/80 shrink-0 gap-4 flex-wrap">
          <div className="relative max-w-sm w-full flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama alat, kode..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm focus:shadow-md transition-shadow duration-200"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button className="bg-slate-50 border border-white/10 text-slate-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/5 ">
                <Filter size={16} /> Kategori
              </button>
              <button className="bg-slate-50 border border-white/10 text-slate-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/5 ">
                <Filter size={16} /> Status
              </button>
            </div>
            {/* View Toggle */}
            <div className="flex gap-1 bg-slate-50 border border-white/10 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('table')} 
                className={`p-1.5 rounded-md text-sm ${viewMode === 'table' ? 'bg-white text-sky-400 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-md text-sm ${viewMode === 'grid' ? 'bg-white text-sky-400 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/5 bg-slate-50/30 grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Mendekati Kalibrasi</div>
            <div className="text-lg font-bold text-amber-400 mt-1 flex items-center gap-2">
              <CalendarClock size={16} /> {calibrationSummary.upcoming}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Lewat Kalibrasi</div>
            <div className="text-lg font-bold text-rose-400 mt-1 flex items-center gap-2">
              <AlertTriangle size={16} /> {calibrationSummary.overdue}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Kalibrasi Aman</div>
            <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-2">
              <CheckCircle2 size={16} /> {calibrationSummary.safe}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Tanpa Kalibrasi</div>
            <div className="text-lg font-bold text-slate-700 mt-1">{calibrationSummary.withoutCalibration}</div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
          {isPending && <div className="absolute inset-0 z-10 bg-slate-50/40" />}
          
          {filteredData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">Data alat kesehatan tidak ditemukan.</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredData.map(item => {
                const calibrationBadge = item.calibrationMode === 'none'
                  ? {
                      label: 'Tanpa kalibrasi',
                      className: 'bg-slate-300/10 text-slate-600 border border-slate-400/20',
                    }
                  : getCalibrationBadge(item.jadwalKalibrasi);

                return (
                <div key={item.id} className="bg-slate-50 border border-white/10 rounded-xl overflow-hidden flex flex-col group relative">
                  <div className="w-full aspect-[4/3] relative bg-white shrink-0">
                    <Image src={item.gambarUrl || getPlaceholder(item.kategori)} alt={item.nama} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized/>
                    <div className="absolute top-3 left-3 bg-slate-50/80 backdrop-blur border border-white/10 px-2 py-1 rounded text-xs font-mono text-sky-400">{item.kode}</div>
                    <div className="absolute top-2 right-2 flex gap-1 bg-slate-50/80 backdrop-blur rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {permissions.u && <button onClick={() => handleOpenEdit(item)} disabled={isPending} className="p-1.5 hover:bg-sky-500/20 text-slate-700 hover:text-sky-400 rounded-md transition-colors"><Edit2 size={14}/></button>}
                      {permissions.d && <button onClick={() => handleDelete(item.id)} disabled={isPending} className="p-1.5 hover:bg-rose-500/20 text-slate-700 hover:text-rose-400 rounded-md transition-colors"><Trash2 size={14}/></button>}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <h3 className="font-bold text-slate-800 line-clamp-1 text-base">{item.nama}</h3>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{item.kategori}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Jumlah</div>
                        <div className="text-sm text-slate-800 font-semibold mt-1">{item.jumlah}</div>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Pengadaan</div>
                        <div className="text-sm text-slate-800 font-semibold mt-1">{item.tahunPengadaan ?? '-'}</div>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Kalibrasi</div>
                        <div className="text-sm text-slate-800 font-semibold mt-1">{item.calibrationMode === 'none' ? 'Tanpa kalibrasi' : formatDateIndonesia(item.jadwalKalibrasi)}</div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                       <span className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center text-center ${getBadgeStyle(item.kondisi)}`}>{item.kondisi}</span>
                       <span className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center text-center ${calibrationBadge.className}`}>{calibrationBadge.label}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-50/50">
                    <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold w-24">Kode Alkes</th>
                    <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Info Alat</th>
                    <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Kategori</th>
                    <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Jumlah</th>
                    <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Pengadaan</th>
                    <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Kalibrasi</th>
                    <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Kelayakan</th>
                    <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.map(item => {
                    const calibrationBadge = item.calibrationMode === 'none'
                      ? {
                          label: 'Tanpa kalibrasi',
                          className: 'bg-slate-300/10 text-slate-600 border border-slate-400/20',
                        }
                      : getCalibrationBadge(item.jadwalKalibrasi);

                    return (
                    <tr key={item.id} className="hover:bg-white/5 group">
                      <td className="py-3 px-4 text-sm font-mono text-sky-400">{item.kode}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border border-white/10 overflow-hidden relative shrink-0">
                            <Image src={item.gambarUrl || getPlaceholder(item.kategori)} alt={item.nama} fill className="object-cover" unoptimized/>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-800">{item.nama}</span>
                            {item.keterangan ? <span className="text-xs text-slate-500 truncate max-w-[260px] mt-0.5">{item.keterangan}</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{item.kategori}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{item.jumlah}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{item.tahunPengadaan ?? '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          {item.calibrationMode === 'none' ? (
                            <span className="text-sm text-slate-500">Tanpa kalibrasi</span>
                          ) : (
                            <>
                              <span className="text-sm text-slate-700">{formatDateIndonesia(item.kalibrasiTerakhir)}</span>
                              <span className="text-xs text-sky-400 mt-0.5">{formatDateIndonesia(item.jadwalKalibrasi)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest leading-none block w-max ${getBadgeStyle(item.kondisi)}`}>{item.kondisi}</span>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold leading-none block w-max ${calibrationBadge.className}`}>{calibrationBadge.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {permissions.u && <button onClick={() => handleOpenEdit(item)} disabled={isPending} className="p-1.5 text-slate-600 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg border border-transparent hover:border-sky-400/20 disabled:opacity-50">
                            <Edit2 size={16} />
                          </button>}
                          {permissions.d && <button onClick={() => handleDelete(item.id)} disabled={isPending} className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg border border-transparent hover:border-rose-400/20 disabled:opacity-50">
                            <Trash2 size={16} />
                          </button>}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Tambah */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{formMode === 'add' ? 'Tambah Alat Kesehatan' : 'Edit Alat Kesehatan'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isPending || isUploading} className="text-slate-600 hover:text-slate-800 ">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1 custom-scrollbar">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Alat <span className="text-rose-400">*</span></label>
                <input required value={nama} onChange={e=>setNama(e.target.value)} disabled={isPending || isUploading} type="text" placeholder="Contoh: Kursi Gigi Belmont" className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Kategori <span className="text-rose-400">*</span></label>
                  <select required value={kategori} onChange={e=>setKategori(e.target.value)} disabled={isPending || isUploading} className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-sky-500 appearance-none disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200">
                    <option value="" disabled>Pilih Kategori...</option>
                    <option value="Non Elektromedik">Non Elektromedik</option>
                    <option value="Alkes Elektromedis">Alkes Elektromedis</option>
                    <option value="Perlengkapan">Perlengkapan</option>
                    <option value="Penyimpanan">Penyimpanan</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Jumlah <span className="text-rose-400">*</span></label>
                  <input required value={jumlah} onChange={e=>setJumlah(e.target.value)} disabled={isPending || isUploading} type="number" min="0" step="1" placeholder="Contoh: 1" className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Tahun Pengadaan <span className="text-rose-400">*</span></label>
                  <input required value={tahunPengadaan} onChange={e=>setTahunPengadaan(e.target.value)} disabled={isPending || isUploading} type="text" inputMode="numeric" maxLength={4} placeholder="Contoh: 2024" className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Kondisi / Kelayakan <span className="text-rose-400">*</span></label>
                  <select required value={kondisi} onChange={e=>setKondisi(e.target.value)} disabled={isPending || isUploading} className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-sky-500 appearance-none disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200">
                    <option value="" disabled>Kelayakan Pakai</option>
                    <option value="Layak Pakai">Layak Pakai</option>
                    <option value="Butuh Perbaikan">Butuh Perbaikan</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Aturan Kalibrasi <span className="text-rose-400">*</span></label>
                  <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-slate-50 p-3">
                    <label className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 cursor-pointer">
                      <input type="radio" name="calibrationMode" value="required" checked={calibrationMode === 'required'} onChange={() => setCalibrationMode('required')} disabled={isPending || isUploading} className="mt-1" />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">Wajib Kalibrasi</span>
                        <span className="text-xs text-slate-500">Tanggal kalibrasi terakhir dan rencana kalibrasi wajib diisi.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 cursor-pointer">
                      <input type="radio" name="calibrationMode" value="none" checked={calibrationMode === 'none'} onChange={() => setCalibrationMode('none')} disabled={isPending || isUploading} className="mt-1" />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">Tanpa Kalibrasi</span>
                        <span className="text-xs text-slate-500">Untuk alat seperti pinset anatomis dan alat lain yang tidak perlu kalibrasi.</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Kalibrasi Terakhir {calibrationMode === 'required' && <span className="text-rose-400">*</span>}</label>
                  <input required={calibrationMode === 'required'} value={kalibrasiTerakhir} onChange={e=>setKalibrasiTerakhir(e.target.value)} disabled={isPending || isUploading || calibrationMode === 'none'} type="date" className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 [color-scheme:dark] disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Jadwal Kalibrasi {calibrationMode === 'required' && <span className="text-rose-400">*</span>}</label>
                  <input required={calibrationMode === 'required'} value={jadwalKalibrasi} onChange={e=>setJadwalKalibrasi(e.target.value)} disabled={isPending || isUploading || calibrationMode === 'none'} type="date" className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 [color-scheme:dark] disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200" />
                  <span className="text-xs text-slate-500">Jika wajib kalibrasi, jadwal tidak boleh lebih awal dari kalibrasi terakhir.</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Keterangan</label>
                <textarea value={keterangan} onChange={e=>setKeterangan(e.target.value)} disabled={isPending || isUploading} rows={2} placeholder="Keterangan tambahan..." className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"></textarea>
              </div>

              {/* Upload Foto Alkes */}
              <div className="bg-slate-50 border border-white/10 p-5 rounded-xl mt-2">
                 <label className="text-sm font-medium text-slate-700 mb-2 block">Upload Foto Alat Kesehatan {formMode === 'add' && <span className="text-rose-400">*</span>}</label>
                 
                 <input type="file" accept="image/*" ref={fileInput} onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                 
                 <div onClick={() => fileInput.current?.click()} className={`border-2 border-dashed rounded-xl bg-white p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors ${file ? 'border-sky-500/50 hover:border-sky-400' : 'border-white/10 hover:border-sky-500/50'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${file ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-slate-600 group-hover:text-sky-400'}`}>
                      {file ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                    </div>
                    <div className="text-base font-semibold text-slate-800 mb-1">
                       {file ? "File Siap Diupload" : existingImage ? "Foto lama dipakai" : "Klik untuk pilih foto alat"}
                    </div>
                    <div className="text-sm text-sky-400 font-mono truncate max-w-[250px]">{file ? file.name : existingImage ? 'Pilih file baru untuk mengganti' : 'Maksimal 5MB (JPG/PNG)'}</div>
                 </div>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-white/80 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isPending || isUploading} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-white/5 disabled:opacity-50">Batal</button>
              <button type="submit" disabled={isPending || isUploading} className="px-5 py-2 rounded-lg text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-600 shadow-sm flex items-center gap-2 disabled:opacity-50">
                  {isUploading ? <><Loader2 size={16} className="animate-spin" /> Mengunggah...</> : isPending ? <><Loader2 size={16} className="animate-spin" /> Menyimpan</> : formMode === 'add' ? 'Simpan Inventaris' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
