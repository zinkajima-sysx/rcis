'use client';
import React, { useState, useTransition } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { createEntitas, updateEntitas, deleteEntitas } from './actions';

export default function EntitasClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({ id: '', entitas: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredData = data.filter(d => 
    d.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.kode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({ id: '', entitas: '' });
    setError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormMode('edit');
    setFormData({ id: item.id, entitas: item.nama });
    setError(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Yakin ingin menghapus entitas ini?')) {
      startTransition(async () => {
        const res = await deleteEntitas(id);
        if (res.success) {
          setData(data.filter(d => d.id !== id));
        } else {
          alert(res.error);
        }
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fData = new FormData();
    fData.append('entitas', formData.entitas);

    startTransition(async () => {
      let res;
      if (formMode === 'add') {
        res = await createEntitas(fData);
      } else {
        res = await updateEntitas(formData.id, fData);
      }

      if (res.success) {
        if (formMode === 'add') {
          setData([...data, res.data]);
        } else {
          setData(data.map(d => d.id === formData.id ? res.data : d));
        }
        setIsFormOpen(false);
      } else {
        setError(res.error || 'Terjadi kesalahan internal');
      }
    });
  };

  return (
    <>
      <div className="flex justify-end mb-4 -mt-14 relative z-10">
        <button onClick={handleOpenAdd} className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm">
          <Plus size={16} /> Tambah Entitas
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-white/10 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-slate-800/80 shrink-0">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama entitas atau jenis..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 "
            />
          </div>
        </div>
        
        <div className="overflow-x-auto w-full flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 bg-slate-800/50">
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold w-24">Kode</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Nama Entitas</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.length > 0 ? filteredData.map((d) => (
                <tr key={d.id} className="hover:bg-white/5 group">
                  <td className="py-3 px-5 text-sm font-mono text-sky-400">{d.kode}</td>
                  <td className="py-3 px-5 text-sm font-semibold text-slate-200">{d.nama}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenEdit(d)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg border border-transparent hover:border-sky-400/20 disabled:opacity-50">
                         <Edit2 size={16} />
                       </button>
                       <button onClick={() => handleDelete(d.id)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg border border-transparent hover:border-rose-400/20 disabled:opacity-50">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-10 text-center text-sm text-slate-500">Data entitas kosong.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-slate-800 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800 shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-50">{formMode === 'add' ? 'Tambah Entitas' : 'Edit Entitas'}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isPending} className="text-slate-400 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>
            
            <div className="p-6 bg-slate-900/50 flex flex-col gap-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm flex gap-3 items-start">
                   <AlertCircle className="shrink-0 mt-0.5" size={16} />
                   <p>{error}</p>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Nama Entitas <span className="text-rose-400">*</span></label>
                <input required type="text" value={formData.entitas} disabled={isPending} onChange={e => setFormData({...formData, entitas: e.target.value})} placeholder="Contoh: Manager Unit" className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50" />
              </div>
            </div>
            
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-slate-800 rounded-b-2xl">
              <button type="button" disabled={isPending} onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50">Batal</button>
              <button type="submit" disabled={isPending} className="px-6 py-2 rounded-lg text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-600 shadow-sm flex items-center justify-center disabled:opacity-50">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
