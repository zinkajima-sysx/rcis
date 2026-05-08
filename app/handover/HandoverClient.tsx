'use client';

import React, { useRef, useState, useTransition } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Edit2,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import Image from 'next/image';

import { formatDateForInputIndonesia, formatDateIndonesia } from '@/lib/date-id';
import type { PermissionSet } from '@/lib/permissions';
import { uploadImageAsset } from '@/lib/uploads/client';

import { createHandover, deleteHandover, updateHandover } from './actions';
import type { HandoverViewItem } from './handover-view';

type DaopOption = {
  id: string;
  nama: string;
};

type UserOption = {
  id: string;
  nip: string;
  nama: string;
};

type HandoverClientProps = {
  initialData: HandoverViewItem[];
  daopOptions: DaopOption[];
  userOptions: UserOption[];
  permissions: PermissionSet;
};

function getTodayIndonesiaInput() {
  return formatDateForInputIndonesia(new Date());
}

export default function HandoverClient({
  initialData,
  daopOptions,
  userOptions,
  permissions,
}: HandoverClientProps) {
  const [data, setData] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const [namaKegiatanDari, setNamaKegiatanDari] = useState('');
  const [tanggalKegiatanAsal, setTanggalKegiatanAsal] = useState('');
  const [wilayahDaopAsal, setWilayahDaopAsal] = useState('');
  const [namaKegiatanKe, setNamaKegiatanKe] = useState('');
  const [tanggalKegiatanKe, setTanggalKegiatanKe] = useState('');
  const [wilayahDaopKe, setWilayahDaopKe] = useState('');
  const [lokasiStasiun, setLokasiStasiun] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nippPenyerah, setNippPenyerah] = useState('');
  const [namaPenyerah, setNamaPenyerah] = useState('');
  const [nippPenerima, setNippPenerima] = useState('');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [tanggalSerahTerima, setTanggalSerahTerima] = useState(getTodayIndonesiaInput());
  const [existingImages, setExistingImages] = useState({ fotoSerahTerima: '', fotoBukti: '' });
  const [fotoSerahTerimaFile, setFotoSerahTerimaFile] = useState<File | null>(null);
  const [fotoBuktiFile, setFotoBuktiFile] = useState<File | null>(null);

  const fileInputSerahTerima = useRef<HTMLInputElement>(null);
  const fileInputBukti = useRef<HTMLInputElement>(null);

  const usersByNipp = new Map(userOptions.map((item) => [item.nip, item]));

  const filteredData = data.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return [
      item.kode,
      item.namaKegiatanDari,
      item.namaKegiatanKe,
      item.lokasiStasiun,
      item.namaPenyerah,
      item.namaPenerima,
      item.nippPenyerah,
      item.nippPenerima,
      item.wilayahDaopAsalNama,
      item.wilayahDaopKeNama,
    ].some((value) => value.toLowerCase().includes(keyword));
  });

  const resetForm = () => {
    setNamaKegiatanDari('');
    setTanggalKegiatanAsal('');
    setWilayahDaopAsal('');
    setNamaKegiatanKe('');
    setTanggalKegiatanKe('');
    setWilayahDaopKe('');
    setLokasiStasiun('');
    setKeterangan('');
    setNippPenyerah('');
    setNamaPenyerah('');
    setNippPenerima('');
    setNamaPenerima('');
    setTanggalSerahTerima(getTodayIndonesiaInput());
    setExistingImages({ fotoSerahTerima: '', fotoBukti: '' });
    setFotoSerahTerimaFile(null);
    setFotoBuktiFile(null);
    setEditingId('');
  };

  const handleSelectPenyerah = (nip: string) => {
    const selectedUser = usersByNipp.get(nip);
    setNippPenyerah(nip);
    setNamaPenyerah(selectedUser?.nama ?? '');
  };

  const handleSelectPenerima = (nip: string) => {
    const selectedUser = usersByNipp.get(nip);
    setNippPenerima(nip);
    setNamaPenerima(selectedUser?.nama ?? '');
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: HandoverViewItem) => {
    setFormMode('edit');
    setEditingId(item.id);
    setNamaKegiatanDari(item.namaKegiatanDari);
    setTanggalKegiatanAsal(item.tanggalKegiatanAsal);
    setWilayahDaopAsal(item.wilayahDaopAsal);
    setNamaKegiatanKe(item.namaKegiatanKe);
    setTanggalKegiatanKe(item.tanggalKegiatanKe);
    setWilayahDaopKe(item.wilayahDaopKe);
    setLokasiStasiun(item.lokasiStasiun);
    setKeterangan(item.keterangan);
    setNippPenyerah(item.nippPenyerah);
    setNamaPenyerah(item.namaPenyerah);
    setNippPenerima(item.nippPenerima);
    setNamaPenerima(item.namaPenerima);
    setTanggalSerahTerima(item.tanggalSerahTerima || getTodayIndonesiaInput());
    setExistingImages({
      fotoSerahTerima: item.fotoSerahTerima,
      fotoBukti: item.fotoBukti,
    });
    setFotoSerahTerimaFile(null);
    setFotoBuktiFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Yakin hapus data serah terima ini?')) {
      startTransition(async () => {
        const result = await deleteHandover(id);

        if (result.success) {
          setData((currentData) => currentData.filter((item) => item.id !== id));
          return;
        }

        alert(result.error);
      });
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formMode === 'add' && (!fotoSerahTerimaFile || !fotoBuktiFile)) {
      alert('Foto serah terima dan foto bukti checklist wajib diunggah.');
      return;
    }

    let fotoSerahTerima = existingImages.fotoSerahTerima;
    let fotoBukti = existingImages.fotoBukti;

    setIsUploading(true);

    try {
      if (fotoSerahTerimaFile) {
        const uploadResult = await uploadImageAsset(fotoSerahTerimaFile, {
          module: 'handover',
          purpose: 'foto-serah-terima',
        });
        fotoSerahTerima = uploadResult.url;
      }

      if (fotoBuktiFile) {
        const uploadResult = await uploadImageAsset(fotoBuktiFile, {
          module: 'handover',
          purpose: 'foto-bukti-checklist',
        });
        fotoBukti = uploadResult.url;
      }
    } catch (error: any) {
      setIsUploading(false);
      alert(`Gagal upload gambar: ${error.message}`);
      return;
    }

    const formData = new FormData();
    formData.append('namaKegiatanDari', namaKegiatanDari);
    formData.append('tanggalKegiatanAsal', tanggalKegiatanAsal);
    formData.append('wilayahDaopAsal', wilayahDaopAsal);
    formData.append('namaKegiatanKe', namaKegiatanKe);
    formData.append('tanggalKegiatanKe', tanggalKegiatanKe);
    formData.append('wilayahDaopKe', wilayahDaopKe);
    formData.append('lokasiStasiun', lokasiStasiun);
    formData.append('keterangan', keterangan);
    formData.append('nippPenyerah', nippPenyerah);
    formData.append('namaPenyerah', namaPenyerah);
    formData.append('nippPenerima', nippPenerima);
    formData.append('namaPenerima', namaPenerima);
    formData.append('tanggalSerahTerima', tanggalSerahTerima);
    formData.append('fotoSerahTerima', fotoSerahTerima);
    formData.append('fotoBukti', fotoBukti);

    startTransition(async () => {
      const result = formMode === 'add'
        ? await createHandover(formData)
        : await updateHandover(editingId, formData);

      setIsUploading(false);

      if (!result.success) {
        alert(result.error);
        return;
      }

      if (!result.data) {
        alert('Data handover berhasil disimpan, tetapi respons detail tidak ditemukan.');
        return;
      }

      setData((currentData) => (
        formMode === 'add'
          ? [result.data, ...currentData]
          : currentData.map((item) => (item.id === editingId ? result.data : item))
      ));
      setIsModalOpen(false);
      resetForm();
    });
  };

  const renderHandoverImage = (imageUrl: string, label: string) => {
    if (imageUrl) {
      return (
        <Image
          src={imageUrl}
          alt={label}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
      );
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white text-slate-500 text-xs font-medium">
        {label} belum tersedia
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-end -mt-14 mb-4 relative z-10">
        {permissions.c && (
          <button
            onClick={handleOpenAdd}
            className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Catat Serah Terima
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 bg-white rounded-2xl border border-white/10 flex flex-col flex-1 overflow-hidden min-h-[500px] shadow-md">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/80 shrink-0 gap-4 flex-wrap">
            <div className="relative max-w-xl w-full flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input
                type="text"
                placeholder="Cari kode, kegiatan, stasiun, DAOP, penyerah, atau penerima..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full bg-slate-50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm focus:shadow-md transition-shadow duration-200"
              />
            </div>
            <div className="flex gap-1 bg-slate-50 border border-white/10 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-sm ${viewMode === 'table' ? 'bg-white text-sky-400 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-sm ${viewMode === 'grid' ? 'bg-white text-sky-400 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
            {isPending && <div className="absolute inset-0 z-10 bg-slate-50/40" />}

            {filteredData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">Data serah terima tidak ditemukan.</div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredData.map((item) => (
                  <article key={item.id} className="bg-slate-50 border border-white/10 rounded-xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex gap-1 p-1 shrink-0">
                      <div className="w-1/2 aspect-video relative rounded-tl-lg rounded-bl-sm overflow-hidden bg-white">
                        {renderHandoverImage(item.fotoSerahTerima, 'Foto serah terima')}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-medium text-slate-700 pointer-events-none">
                          Foto Serah Terima
                        </div>
                      </div>
                      <div className="w-1/2 aspect-video relative rounded-tr-lg rounded-br-sm overflow-hidden bg-white">
                        {renderHandoverImage(item.fotoBukti, 'Foto bukti checklist')}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-medium text-slate-700 pointer-events-none">
                          Foto Bukti
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-4 flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest font-mono mb-2 inline-block">
                            {item.kode}
                          </div>
                          <h3 className="font-bold text-slate-800 line-clamp-2">
                            {item.namaKegiatanDari}
                          </h3>
                          <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                            <ArrowRight size={12} />
                            <span className="line-clamp-1">{item.namaKegiatanKe}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {permissions.u && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              disabled={isPending}
                              className="text-slate-600 hover:text-sky-400 hover:bg-sky-400/10 p-1.5 rounded-md border border-transparent hover:border-sky-400/20 disabled:opacity-50"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {permissions.d && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isPending}
                              className="text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 p-1.5 rounded-md border border-transparent hover:border-rose-400/20 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="text-slate-500 uppercase tracking-widest text-[10px] mb-1">Asal</div>
                          <div className="text-slate-800 font-semibold line-clamp-1">{item.wilayahDaopAsalNama}</div>
                          <div className="text-slate-600 mt-1">{formatDateIndonesia(item.tanggalKegiatanAsal)}</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="text-slate-500 uppercase tracking-widest text-[10px] mb-1">Tujuan</div>
                          <div className="text-slate-800 font-semibold line-clamp-1">{item.wilayahDaopKeNama}</div>
                          <div className="text-slate-600 mt-1">{formatDateIndonesia(item.tanggalKegiatanKe)}</div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/40 p-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                          <MapPin size={14} />
                          <span>Lokasi serah terima</span>
                        </div>
                        <div className="font-medium">{item.lokasiStasiun}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Tanggal serah terima: {formatDateIndonesia(item.tanggalSerahTerima)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-auto">
                        <div className="flex-1 bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col items-center text-center">
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1">Penyerah</span>
                          <span className="text-xs font-semibold text-slate-700 line-clamp-1">{item.namaPenyerah}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">NIPP. {item.nippPenyerah}</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-500 shrink-0" />
                        <div className="flex-1 bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col items-center text-center">
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1">Penerima</span>
                          <span className="text-xs font-semibold text-slate-700 line-clamp-1">{item.namaPenerima}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">NIPP. {item.nippPenerima}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-50/50">
                      <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">No. BAST</th>
                      <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Alur Kegiatan</th>
                      <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Wilayah</th>
                      <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Lokasi</th>
                      <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Serah Terima</th>
                      <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Penyerah</th>
                      <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold">Penerima</th>
                      <th className="py-3 px-4 text-xs text-slate-600 uppercase tracking-wider font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 group">
                        <td className="py-3 px-4">
                          <div className="font-mono text-sky-400 text-sm">{item.kode}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-semibold text-slate-800">{item.namaKegiatanDari}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <ArrowRight size={12} />
                            <span>{item.namaKegiatanKe}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {formatDateIndonesia(item.tanggalKegiatanAsal)} - {formatDateIndonesia(item.tanggalKegiatanKe)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          <div>{item.wilayahDaopAsalNama}</div>
                          <div className="text-xs text-slate-500 mt-1">ke {item.wilayahDaopKeNama}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-slate-500 mt-0.5 shrink-0" />
                            <span>{item.lokasiStasiun}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-500" />
                            <span>{formatDateIndonesia(item.tanggalSerahTerima)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          <div className="font-medium">{item.namaPenyerah}</div>
                          <div className="text-xs text-slate-500 mt-1 font-mono">{item.nippPenyerah}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-700">
                          <div className="font-medium">{item.namaPenerima}</div>
                          <div className="text-xs text-slate-500 mt-1 font-mono">{item.nippPenerima}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {permissions.u && (
                              <button
                                onClick={() => handleOpenEdit(item)}
                                disabled={isPending}
                                className="p-1.5 text-slate-600 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg border border-transparent hover:border-sky-400/20 disabled:opacity-50"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {permissions.d && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={isPending}
                                className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg border border-transparent hover:border-rose-400/20 disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="bg-white rounded-2xl border border-white/10 p-5 flex flex-col gap-4 shadow-md">
          <div className="text-sm font-semibold text-slate-800">Ringkasan Handover</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Total</div>
              <div className="text-2xl font-semibold text-slate-800">{data.length}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Terfilter</div>
              <div className="text-2xl font-semibold text-slate-800">{filteredData.length}</div>
            </div>
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-slate-700">
            <div className="font-semibold text-sky-400 mb-2">Format & aturan</div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>1. Tanggal kegiatan tujuan tidak boleh sama dengan tanggal kegiatan asal.</li>
              <li>2. Input NIPP untuk Petugas yang melakukan Serah terima</li>
              <li>3. Jika NIPP tidak ada berarti belum ada di Master data User.</li>
            </ul>
          </div>
        </aside>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white border border-white/10 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {formMode === 'add' ? 'Catat Serah Terima Baru' : 'Edit Serah Terima'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Form mengikuti alur kegiatan asal ke kegiatan tujuan tanpa memutus kompatibilitas data lama.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending || isUploading}
                className="text-slate-600 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1 custom-scrollbar">
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 p-5 rounded-xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sky-400 font-semibold">
                    <ArrowRight size={16} />
                    <span>Kegiatan Asal</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nama Kegiatan Dari <span className="text-rose-400">*</span></label>
                    <input
                      required
                      value={namaKegiatanDari}
                      onChange={(event) => setNamaKegiatanDari(event.target.value)}
                      disabled={isPending || isUploading}
                      type="text"
                      placeholder="Contoh: Rail Clinic Stasiun Banjar"
                      className="w-full bg-white border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Tanggal Kegiatan Asal <span className="text-rose-400">*</span></label>
                      <input
                        required
                        value={tanggalKegiatanAsal}
                        onChange={(event) => setTanggalKegiatanAsal(event.target.value)}
                        disabled={isPending || isUploading}
                        type="date"
                        className="w-full bg-white border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 [color-scheme:dark] disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Wilayah DAOP Asal <span className="text-rose-400">*</span></label>
                      <select
                        required
                        value={wilayahDaopAsal}
                        onChange={(event) => setWilayahDaopAsal(event.target.value)}
                        disabled={isPending || isUploading}
                        className="w-full bg-white border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                      >
                        <option value="">Pilih wilayah asal</option>
                        {daopOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.id} - {option.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-5 rounded-xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <MapPin size={16} />
                    <span>Kegiatan Tujuan</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nama Kegiatan Ke <span className="text-rose-400">*</span></label>
                    <input
                      required
                      value={namaKegiatanKe}
                      onChange={(event) => setNamaKegiatanKe(event.target.value)}
                      disabled={isPending || isUploading}
                      type="text"
                      placeholder="Contoh: Rail Clinic Stasiun Kroya"
                      className="w-full bg-white border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Tanggal Kegiatan Ke <span className="text-rose-400">*</span></label>
                      <input
                        required
                        value={tanggalKegiatanKe}
                        onChange={(event) => setTanggalKegiatanKe(event.target.value)}
                        disabled={isPending || isUploading}
                        type="date"
                        className="w-full bg-white border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 [color-scheme:dark] disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Wilayah DAOP Tujuan <span className="text-rose-400">*</span></label>
                      <select
                        required
                        value={wilayahDaopKe}
                        onChange={(event) => setWilayahDaopKe(event.target.value)}
                        disabled={isPending || isUploading}
                        className="w-full bg-white border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                      >
                        <option value="">Pilih wilayah tujuan</option>
                        {daopOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.id} - {option.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Lokasi Stasiun <span className="text-rose-400">*</span></label>
                  <input
                    required
                    value={lokasiStasiun}
                    onChange={(event) => setLokasiStasiun(event.target.value)}
                    disabled={isPending || isUploading}
                    type="text"
                    placeholder="Contoh: Stasiun Wates"
                    className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Tanggal Serah Terima <span className="text-rose-400">*</span></label>
                  <input
                    required
                    value={tanggalSerahTerima}
                    onChange={(event) => setTanggalSerahTerima(event.target.value)}
                    disabled={isPending || isUploading}
                    type="date"
                    className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 [color-scheme:dark] disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                  />
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 p-5 rounded-xl border border-white/5 space-y-4">
                  <div className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                    <UserCheck size={16} />
                    <span>Penyerah</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">NIPP Penyerah <span className="text-rose-400">*</span></label>
                    <select
                      required
                      value={nippPenyerah}
                      onChange={(event) => handleSelectPenyerah(event.target.value)}
                      disabled={isPending || isUploading}
                      className="w-full bg-white border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                    >
                      <option value="">Pilih user penyerah</option>
                      {userOptions.map((option) => (
                        <option key={option.id} value={option.nip}>
                          {option.nip} - {option.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nama Penyerah</label>
                    <input
                      value={namaPenyerah}
                      readOnly
                      type="text"
                      className="w-full bg-white/70 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="bg-slate-50/50 p-5 rounded-xl border border-white/5 space-y-4">
                  <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <UserCheck size={16} />
                    <span>Penerima</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">NIPP Penerima <span className="text-rose-400">*</span></label>
                    <select
                      required
                      value={nippPenerima}
                      onChange={(event) => handleSelectPenerima(event.target.value)}
                      disabled={isPending || isUploading}
                      className="w-full bg-white border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                    >
                      <option value="">Pilih user penerima</option>
                      {userOptions.map((option) => (
                        <option key={option.id} value={option.nip}>
                          {option.nip} - {option.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nama Penerima</label>
                    <input
                      value={namaPenerima}
                      readOnly
                      type="text"
                      className="w-full bg-white/70 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Keterangan</label>
                <textarea
                  value={keterangan}
                  onChange={(event) => setKeterangan(event.target.value)}
                  disabled={isPending || isUploading}
                  rows={3}
                  placeholder="Deskripsi kegiatan, catatan checklist, atau keterangan penting lainnya."
                  className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 disabled:opacity-50 shadow-sm focus:shadow-md transition-shadow duration-200"
                />
              </section>

              <section className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4">
                <div className="text-sm font-semibold text-sky-400 flex items-center gap-2 mb-4">
                  <FileText size={16} /> Upload Bukti Serah Terima
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputSerahTerima}
                    onChange={(event) => setFotoSerahTerimaFile(event.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputSerahTerima.current?.click()}
                    className={`border-2 border-dashed rounded-xl bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors ${fotoSerahTerimaFile ? 'border-sky-500/50 hover:border-sky-400' : 'border-white/10 hover:border-sky-500/50'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${fotoSerahTerimaFile ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-slate-600 group-hover:text-sky-400'}`}>
                      {fotoSerahTerimaFile ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                    </div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Foto Serah Terima {formMode === 'add' && <span className="text-rose-400">*</span>}
                    </div>
                    <div className="text-xs text-sky-400 font-mono truncate max-w-[220px]">
                      {fotoSerahTerimaFile ? fotoSerahTerimaFile.name : existingImages.fotoSerahTerima ? 'Foto lama dipakai' : 'Pilih file (maks 5MB)'}
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputBukti}
                    onChange={(event) => setFotoBuktiFile(event.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputBukti.current?.click()}
                    className={`border-2 border-dashed rounded-xl bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors ${fotoBuktiFile ? 'border-emerald-500/50 hover:border-emerald-400' : 'border-white/10 hover:border-emerald-500/50'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${fotoBuktiFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600 group-hover:text-emerald-400'}`}>
                      {fotoBuktiFile ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                    </div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Foto Bukti Checklist {formMode === 'add' && <span className="text-rose-400">*</span>}
                    </div>
                    <div className="text-xs text-emerald-400 font-mono truncate max-w-[220px]">
                      {fotoBuktiFile ? fotoBuktiFile.name : existingImages.fotoBukti ? 'Foto lama dipakai' : 'Pilih file (maks 5MB)'}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-white/80 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending || isUploading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-white/5 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending || isUploading}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-600 shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Mengunggah...
                  </>
                ) : isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Menyimpan...
                  </>
                ) : formMode === 'add' ? 'Simpan BAST' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
