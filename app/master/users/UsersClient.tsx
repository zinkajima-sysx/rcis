'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { AlertCircle, Edit2, Eye, EyeOff, Plus, Search, ShieldAlert, ShieldCheck, Trash2, Users, X } from 'lucide-react';

import type { PermissionSet } from '@/lib/permissions';
import { createUser, deleteUser, updateUser } from './actions';

type UserItem = {
  id: string;
  nip: string;
  nama: string;
  entitasId: string;
  entitasNama: string;
  daopId: string;
  daopNama: string;
  berlakuSampai: string | null;
  createdAt: string;
};

type OptionItem = {
  id: string;
  nama: string;
};

export default function UsersClient({
  initialData,
  entitasOptions,
  daopOptions,
  permissions,
  isCurrentSuperadmin,
}: {
  initialData: UserItem[];
  entitasOptions: OptionItem[];
  daopOptions: OptionItem[];
  permissions: PermissionSet;
  isCurrentSuperadmin: boolean;
}) {
  const [users, setUsers] = useState(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [now] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    nip: '',
    nama: '',
    entitasId: entitasOptions[0]?.id ?? '',
    daopId: '',
    berlakuSampai: '',
  });

  const selectedEntitas = useMemo(
    () => entitasOptions.find((item) => item.id === formData.entitasId),
    [entitasOptions, formData.entitasId],
  );
  const selectedEntitasName = selectedEntitas?.nama.trim().toLowerCase() ?? '';
  const isSuperadmin = selectedEntitasName === 'superadmin';
  const requiresScopedFields = selectedEntitas ? !['superadmin', 'admin'].includes(selectedEntitasName) : true;
  const requiresBerlakuSampai = selectedEntitas ? !isSuperadmin : true;

  const filteredUsers = users.filter((user) => {
    const keyword = searchTerm.toLowerCase();
    return (
      user.nama.toLowerCase().includes(keyword) ||
      user.nip.toLowerCase().includes(keyword) ||
      user.id.toLowerCase().includes(keyword)
    );
  });

  const resetForm = () => {
    setFormData({
      id: '',
      password: '',
      nip: '',
      nama: '',
      entitasId: entitasOptions[0]?.id ?? '',
      daopId: '',
      berlakuSampai: '',
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormMode('add');
    setShowPassword(false);
    setError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setFormMode('edit');
    setShowPassword(false);
    setFormData({
      id: user.id,
      password: '',
      nip: user.nip,
      nama: user.nama,
      entitasId: user.entitasId,
      daopId: user.daopId,
      berlakuSampai: user.berlakuSampai ? user.berlakuSampai.slice(0, 10) : '',
    });
    setError(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteUser(id);

      if (result.success) {
        setUsers(users.filter((user) => user.id !== id));
        return;
      }

      alert(result.error);
    });
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = new FormData();
    payload.append('password', formData.password);
    payload.append('nip', formData.nip);
    payload.append('nama', formData.nama);
    payload.append('entitasId', formData.entitasId);
    payload.append('daopId', requiresScopedFields ? formData.daopId : '');
    payload.append('berlakuSampai', requiresBerlakuSampai ? formData.berlakuSampai : '');

    startTransition(async () => {
      const result = formMode === 'add' ? await createUser(payload) : await updateUser(formData.id, payload);

      if (!result.success || !result.data) {
        setError(result.error || 'Terjadi kesalahan internal.');
        return;
      }

      if (formMode === 'add') {
        setUsers([result.data, ...users]);
      } else {
        setUsers(users.map((user) => (user.id === formData.id ? result.data : user)));
      }

      setIsFormOpen(false);
      resetForm();
    });
  };

  const getRoleBadge = (role: string) => {
    if (role.toLowerCase() === 'superadmin') {
      return (
        <span className="bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
          <ShieldAlert size={12} /> Superadmin
        </span>
      );
    }

    return (
      <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max">
        <ShieldCheck size={12} /> {role}
      </span>
    );
  };

  const formatBerlakuSampai = (value: string | null, role: string) => {
    if (role.toLowerCase() === 'superadmin') {
      return 'Tidak dibatasi';
    }

    return value ? new Date(value).toLocaleDateString('id-ID') : 'Belum diatur';
  };

  const getValidityBadge = (user: UserItem) => {
    if (user.entitasNama.toLowerCase() === 'superadmin') {
      return 'text-fuchsia-400';
    }

    if (!user.berlakuSampai || new Date(user.berlakuSampai).getTime() < now) {
      return 'text-rose-400';
    }

    return 'text-emerald-400';
  };

  return (
    <>
      <div className="flex justify-end mb-4 -mt-14 relative z-10">
        {permissions.c && (
          <button onClick={handleOpenAdd} className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Tambah User
          </button>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl border border-white/10 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-slate-800/80 shrink-0">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari ID user, NIPP, atau nama pegawai..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 "
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 bg-slate-800/50">
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">User ID</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">NIPP / Login ID</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Nama Lengkap</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Entitas</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Daop / Divre</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Berlaku Sampai</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold">Dibuat Pada</th>
                <th className="py-4 px-5 text-xs text-slate-400 uppercase tracking-wider font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 group">
                  <td className="py-3 px-5 text-xs font-mono text-sky-400">{user.id}</td>
                  <td className="py-3 px-5 text-sm text-slate-300 font-mono">{user.nip}</td>
                  <td className="py-3 px-5 text-sm font-semibold text-slate-200">{user.nama}</td>
                  <td className="py-3 px-5">{getRoleBadge(user.entitasNama)}</td>
                  <td className="py-3 px-5 text-sm text-slate-400">{user.daopNama}</td>
                  <td className={`py-3 px-5 text-sm font-medium ${getValidityBadge(user)}`}>{formatBerlakuSampai(user.berlakuSampai, user.entitasNama)}</td>
                  <td className="py-3 px-5 text-sm text-slate-400">{new Date(user.createdAt).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex justify-end gap-2">
                      {permissions.u && (isCurrentSuperadmin || user.entitasNama.toLowerCase() !== 'superadmin') && <button onClick={() => handleOpenEdit(user)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg border border-transparent hover:border-sky-400/20 disabled:opacity-50">
                        <Edit2 size={16} />
                      </button>}
                      {permissions.d && (isCurrentSuperadmin || user.entitasNama.toLowerCase() !== 'superadmin') && <button onClick={() => handleDelete(user.id)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg border border-transparent hover:border-rose-400/20 disabled:opacity-50">
                        <Trash2 size={16} />
                      </button>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">Belum ada data user di database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-slate-800 border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800 shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <Users size={18} className="text-sky-400" /> {formMode === 'add' ? 'Tambah User' : 'Edit User'}
              </h2>
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isPending} className="text-slate-400 hover:text-white p-1 rounded-md"><X size={18} /></button>
            </div>
            <div className="p-6 bg-slate-900/50 flex flex-col gap-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm flex gap-3 items-start">
                  <AlertCircle className="shrink-0 mt-0.5" size={16} />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">NIPP / Login ID <span className="text-rose-400">*</span></label>
                  <input required type="text" value={formData.nip} onChange={(event) => setFormData({ ...formData, nip: event.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Nama Pegawai <span className="text-rose-400">*</span></label>
                  <input required type="text" value={formData.nama} onChange={(event) => setFormData({ ...formData, nama: event.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 " />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Password {formMode === 'add' && <span className="text-rose-400">*</span>}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    placeholder={formMode === 'edit' ? '(Biarkan kosong jika tidak diubah)' : 'Masukkan password'}
                    required={formMode === 'add'}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 pr-11 text-sm text-slate-200 focus:outline-none focus:border-sky-500 "
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Berlaku Sampai {requiresBerlakuSampai && <span className="text-rose-400">*</span>}</label>
                <input
                  type="date"
                  value={formData.berlakuSampai}
                  onChange={(event) => setFormData({ ...formData, berlakuSampai: event.target.value })}
                  required={requiresBerlakuSampai}
                  disabled={!requiresBerlakuSampai}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Entitas <span className="text-rose-400">*</span></label>
                  <select required value={formData.entitasId} onChange={(event) => setFormData({ ...formData, entitasId: event.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 ">
                    {entitasOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Daop / Divre {requiresScopedFields && <span className="text-rose-400">*</span>}</label>
                  <select value={formData.daopId} onChange={(event) => setFormData({ ...formData, daopId: event.target.value })} required={requiresScopedFields} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 ">
                    <option value="">Pilih Daop / Divre</option>
                    {daopOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-slate-800 rounded-b-2xl">
              <button type="button" onClick={() => setIsFormOpen(false)} disabled={isPending} className="px-5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50">Batal</button>
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
