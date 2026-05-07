'use client';
import React, { useState, useTransition, useRef } from 'react';
import { Plus, Search, MapPin, Calendar, Upload, X, Edit2, Trash2, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { createGaleri, deleteGaleri, updateGaleri } from './actions';
import { uploadImageAsset } from '@/lib/uploads/client';
import type { PermissionSet } from '@/lib/permissions';

export default function GaleriClient({ initialData, daopList, jadwalSelesai, permissions }: { initialData: any[], daopList: any[], jadwalSelesai: any[], permissions: PermissionSet }) {
  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDaop, setFilterDaop] = useState('Semua Daop/Divre');

  // Form states
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [daop, setDaop] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Real Upload States
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInput1 = useRef<HTMLInputElement>(null);
  const fileInput2 = useRef<HTMLInputElement>(null);

  const filteredData = data.filter(d => {
    const matchesSearch = d.namaKegiatan.toLowerCase().includes(searchTerm.toLowerCase()) || d.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDaop = filterDaop === 'Semua Daop/Divre' || d.daop === filterDaop;
    return matchesSearch && matchesDaop;
  });

  const resetForm = () => {
    setNamaKegiatan('');
    setTanggal('');
    setDaop('');
    setLokasi('');
    setKeterangan('');
    setFile1(null);
    setFile2(null);
    setExistingImages([]);
    setEditingId('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormMode('edit');
    setEditingId(item.id);
    setNamaKegiatan(item.namaKegiatan);
    setTanggal(new Date(item.tanggal).toISOString().split('T')[0]);
    setDaop(item.daop);
    setLokasi(item.lokasi);
    setKeterangan(item.keterangan ?? '');
    setFile1(null);
    setFile2(null);
    setExistingImages(item.images ?? []);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Yakin hapus dokumentasi ini?')) {
      startTransition(async () => {
        const res = await deleteGaleri(id);
        if(res.success) {
           setData(data.filter(d => d.id !== id));
        } else {
           alert(res.error);
        }
      });
    }
  };

  // Handler for Jadwal RC selection
  const handleJadwalSelect = (title: string) => {
    setNamaKegiatan(title);
    const selected = jadwalSelesai.find(j => j.title === title);
    if (selected) {
       // Format Date to YYYY-MM-DD for input type="date"
       const dateStr = new Date(selected.date).toISOString().split('T')[0];
       setTanggal(dateStr);
       setLokasi(selected.location);
       setDaop(selected.daop);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'add' && !file1 && !file2) {
       alert("Minimal upload 1 foto kegiatan!");
       return;
    }

    setIsUploading(true);
    let url1 = existingImages[0] ?? '', url2 = existingImages[1] ?? '';
    
    try {
      if(file1) {
        const upload1 = await uploadImageAsset(file1, {
          module: 'galeri',
          purpose: 'foto-utama',
        });
        url1 = upload1.url;
      }
      if(file2) {
        const upload2 = await uploadImageAsset(file2, {
          module: 'galeri',
          purpose: 'foto-tambahan',
        });
        url2 = upload2.url;
      }
    } catch(err: any) {
      alert("Gagal upload gambar: " + err.message);
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('namaKegiatan', namaKegiatan);
    formData.append('tanggal', tanggal);
    formData.append('daop', daop);
    formData.append('lokasi', lokasi);
    formData.append('keterangan', keterangan);
    formData.append('img1', url1);
    formData.append('img2', url2);

    startTransition(async () => {
      const res = formMode === 'add' ? await createGaleri(formData) : await updateGaleri(editingId, formData);
      setIsUploading(false);
      if (res.success) {
        if (formMode === 'add') {
          setData([res.data, ...data]);
        } else {
          setData(data.map((item) => item.id === editingId ? res.data : item));
        }
        setIsModalOpen(false);
        resetForm();
      } else {
        alert(res.error);
      }
    });
  };

  const renderGalleryImage = (imageUrl: string | undefined, label: string, className: string) => {
    if (imageUrl) {
      return <Image src={imageUrl} alt={label} fill className={`object-cover group-hover:scale-105 transition-transform duration-500 ${className}`} unoptimized />;
    }

    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-white text-slate-500 text-xs font-medium ${className}`}>
        {label} belum tersedia
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center shrink-0 gap-4 flex-wrap">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input 
            type="text" 
            placeholder="Cari kegiatan, lokasi stasiun..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm focus:shadow-md transition-shadow duration-200"
          />
        </div>
        <div className="flex gap-3">
          <select 
            value={filterDaop} 
            onChange={e=>setFilterDaop(e.target.value)} 
            className="bg-slate-50 border border-white/10 text-slate-700 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-sky-500 cursor-pointer appearance-none pr-8 relative shadow-sm focus:shadow-md transition-shadow duration-200"
          >
            <option value="Semua Daop/Divre">Semua Daop/Divre</option>
            {daopList?.map(d => (
               <option key={d.id} value={d.nama}>{d.nama}</option>
            ))}
          </select>
          {permissions.c && (
            <button 
               onClick={handleOpenAdd}
               className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm"
            >
               <Plus size={16} /> Tambah Galeri
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shrink-0">
        {filteredData.length > 0 ? filteredData.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-white/10 overflow-hidden flex flex-col group relative shadow-md hover:shadow-lg transition-shadow duration-300">
            {isPending && <div className="absolute inset-0 z-10 bg-slate-50/40 rounded-2xl pointer-events-none" />}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 shrink-0">
              <div className="relative aspect-square overflow-hidden rounded-tl-xl rounded-bl-sm">
                {renderGalleryImage(item.images?.[0], 'Foto utama', '')}
              </div>
              <div className="relative aspect-square overflow-hidden rounded-tr-xl rounded-br-sm">
                {renderGalleryImage(item.images?.[1], 'Foto tambahan', '')}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col relative z-20">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest font-mono">{item.kode}</span>
                <div className="flex gap-2">
                   {permissions.u && <button onClick={() => handleOpenEdit(item)} disabled={isPending} className="text-slate-600 hover:text-sky-400 hover:bg-sky-400/10 p-1.5 rounded-lg border border-transparent hover:border-sky-400/20 disabled:opacity-50"><Edit2 size={16}/></button>}
                   {permissions.d && <button onClick={() => handleDelete(item.id)} disabled={isPending} className="text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 p-1.5 rounded-lg border border-transparent hover:border-rose-400/20 disabled:opacity-50"><Trash2 size={16}/></button>}
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-3 line-clamp-2">{item.namaKegiatan}</h3>
              <div className="mt-auto flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={14} className="text-slate-500" /> {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} className="text-slate-500" /> {item.lokasi} ({item.daop})
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 flex items-center justify-center text-slate-500 text-sm">
             Belum ada data dokumentasi kegiatan yang dicarI.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{formMode === 'add' ? 'Upload Galeri Baru' : 'Edit Galeri'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isPending || isUploading} className="text-slate-600 hover:text-slate-800 ">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1 custom-scrollbar">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Kegiatan Rail Clinic (Yang Telah Selesai) <span className="text-rose-400">*</span></label>
                {jadwalSelesai?.length > 0 ? (
                  <select 
                    required 
                    value={namaKegiatan} 
                    onChange={e => handleJadwalSelect(e.target.value)} 
                    disabled={isPending || isUploading} 
                    className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 appearance-none disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                  >
                    <option value="" disabled>Pilih dari Jadwal RC...</option>
                    {jadwalSelesai.map(j => (
                      <option key={j.id} value={j.title}>{j.title}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    Belum ada Jadwal RC yang berstatus &quot;Selesai&quot;. Anda perlu mengubah status jadwal menjadi selesai di modul Jadwal RC terlebih dahulu.
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Tanggal <span className="text-rose-400">*</span></label>
                  <input required value={tanggal} onChange={e=>setTanggal(e.target.value)} disabled={isPending || isUploading} type="date" className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-sky-500 [color-scheme:dark] disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Wilayah Daop/Divre <span className="text-rose-400">*</span></label>
                  <select required value={daop} onChange={e=>setDaop(e.target.value)} disabled={isPending || isUploading} className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-sky-500 appearance-none disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200">
                    <option value="" disabled>Pilih Wilayah...</option>
                    {daopList?.map(d => (
                       <option key={d.id} value={d.nama}>{d.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Lokasi Stasiun <span className="text-rose-400">*</span></label>
                <input required value={lokasi} onChange={e=>setLokasi(e.target.value)} disabled={isPending || isUploading} type="text" placeholder="Contoh: Stasiun Wates" className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Keterangan (Opsional)</label>
                <textarea value={keterangan} onChange={e=>setKeterangan(e.target.value)} disabled={isPending || isUploading} rows={2} placeholder="Deskripsi ringkas kegiatan..." className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"></textarea>
              </div>

              {/* Upload Foto Galeri */}
              <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 mt-2">
                <div className="text-sm font-semibold text-sky-400 flex items-center gap-2 mb-4">
                  <FileText size={16} /> Upload Dokumentasi Kegiatan (Max 2 Foto)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="file" accept="image/*" ref={fileInput1} onChange={e => setFile1(e.target.files?.[0] || null)} className="hidden" />
                  <div onClick={() => fileInput1.current?.click()} className={`border-2 border-dashed rounded-xl bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors ${file1 ? 'border-sky-500/50 hover:border-sky-400' : 'border-white/10 hover:border-sky-500/50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${file1 ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-slate-600 group-hover:text-sky-400'}`}>
                      {file1 ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                    </div>
                    <div className="text-sm font-medium text-slate-700 mb-1">Foto Utama {formMode === 'add' && <span className="text-rose-400">*</span>}</div>
                    <div className="text-xs text-sky-400 font-mono truncate max-w-[200px]">{file1 ? file1.name : existingImages[0] ? 'Foto lama dipakai' : 'Pilih file (Maks 5MB)'}</div>
                  </div>
                  
                  <input type="file" accept="image/*" ref={fileInput2} onChange={e => setFile2(e.target.files?.[0] || null)} className="hidden" />
                  <div onClick={() => fileInput2.current?.click()} className={`border-2 border-dashed rounded-xl bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors ${file2 ? 'border-emerald-500/50 hover:border-emerald-400' : 'border-white/10 hover:border-emerald-500/50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${file2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600 group-hover:text-emerald-400'}`}>
                      {file2 ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                    </div>
                    <div className="text-sm font-medium text-slate-700 mb-1">Foto Tambahan (Opsional)</div>
                    <div className="text-xs text-emerald-400 font-mono truncate max-w-[200px]">{file2 ? file2.name : 'Pilih file (Maks 5MB)'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-white/80 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isPending || isUploading} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-white/5 disabled:opacity-50">Batal</button>
              <button type="submit" disabled={isPending || isUploading || !namaKegiatan} className="px-5 py-2 rounded-lg text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-600 shadow-sm flex items-center gap-2 disabled:opacity-50">
                 {isUploading ? <><Loader2 size={16} className="animate-spin"/> Mengunggah...</> : isPending ? <><Loader2 size={16} className="animate-spin"/> Menyimpan</> : formMode === 'add' ? 'Simpan Galeri' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
