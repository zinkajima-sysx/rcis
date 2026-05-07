'use client';

import React, { useState, useTransition } from 'react';
import { AlertCircle, Edit2, Map, Plus, Search, Trash2, X } from 'lucide-react';

import { createDaop, deleteDaop, updateDaop } from './actions';

export default function DaopClient({ initialData }: { initialData: { id: string; nama: string }[] }) {
  const [data, setData] = useState(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({ id: '', nama: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredData = data.filter((item) => item.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({ id: '', nama: '' });
    setError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: { id: string; nama: string }) => {
    setFormMode('edit');
    setFormData(item);
    setError(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Yakin ingin menghapus wilayah ini?')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteDaop(id);

      if (result.success) {
        setData(data.filter((item) => item.id !== id));
        return;
      }

      alert(result.error);
    });
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = new FormData();
    payload.append('nama', formData.nama);

    startTransition(async () => {
      const result = formMode === 'add' ? await createDaop(payload) : await updateDaop(formData.id, payload);

      if (!result.success || !result.data) {
        setError(result.error || 'Terjadi kesalahan internal.');
        return;
      }

      if (formMode === 'add') {
        setData([...data, result.data]);
      } else {
        setData(data.map((item) => (item.id === formData.id ? result.data : item)));
      }

      setIsFormOpen(false);
    });
  };

  return (
    <>
      <div className="flex justify-end mb-4 -mt-14 relative z-10">
        <button onClick={handleOpenAdd} className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm">
          <Plus size={16} /> Tambah Wilayah
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-white/10 flex flex-col flex-1 overflow-hidden shadow-md">
        <div className="p-4 border-b border-white/10 bg-white/80 shrink-0">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input type="text" placeholder="Cari Daop / Divre..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-slate-50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm focus:shadow-md transition-shadow duration-200" />
          </div>
        </div>

        <div className="overflow-x-auto w-full flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 bg-white/50">
                <th className="py-4 px-5 text-xs text-slate-600 uppercase tracking-wider font-semibold w-20">No</th>
                <th className="py-4 px-5 text-xs text-slate-600 uppercase tracking-wider font-semibold">Nama Daop / Divre</th>
                <th className="py-4 px-5 text-xs text-slate-600 uppercase tracking-wider font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.length > 0 ? filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-white/5 group">
                  <td className="py-3 px-5 text-sm font-mono text-sky-400">{index + 1}</td>
                  <td className="py-3 px-5 text-sm font-semibold text-slate-800">{item.nama}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenEdit(item)} disabled={isPending} className="p-1.5 text-slate-600 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg border border-transparent hover:border-sky-400/20 disabled:opacity-50">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={isPending} className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg border border-transparent hover:border-rose-400/20 disabled:opacity-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-sm text-slate-500">Belum ada data Daop / Divre di database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white border border-white/10 w-full max-w-md rounded-2xl shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Map size={18} className="text-sky-400" /> {formMode === 'add' ? 'Tambah Wilayah' : 'Edit Wilayah'}
              </h2>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isPending} className="text-slate-600 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>
            <div className="p-6 bg-slate-50/50 flex flex-col gap-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm flex gap-3 items-start">
                  <AlertCircle className="shrink-0 mt-0.5" size={16} />
                  <p>{error}</p>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Daop / Divre <span className="text-rose-400">*</span></label>
                <input required type="text" value={formData.nama} onChange={(event) => setFormData({ ...formData, nama: event.target.value })} placeholder="Contoh: Daop 1 Jakarta" className="w-full bg-slate-50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm focus:shadow-md transition-shadow duration-200" />
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white rounded-b-2xl">
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isPending} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-white/5 disabled:opacity-50">Batal</button>
              <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-600 shadow-sm disabled:opacity-50">
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
