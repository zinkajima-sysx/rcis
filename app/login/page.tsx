'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  nip: z.string().min(1, 'NIPP wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        // Login berhasil, redirect ke dashboard
        router.push('/');
      } else {
        setError(result.error || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-40 items-center justify-center rounded-2xl bg-white p-4 shadow-lg shadow-slate-950/30">
            <Image
              src="/logorcis.png"
              alt="Logo RCIS"
              width={128}
              height={64}
              className="h-full w-full object-contain"
              priority
              unoptimized
            />
          </div>
          <h2 className="text-3xl font-bold text-slate-50">Login RCIS</h2>
          <p className="mt-2 text-slate-400">Masuk ke sistem Rail Clinic Inventory System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="nip" className="block text-sm font-medium text-slate-300">
              NIPP
            </label>
            <input
              {...register('nip')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-800 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              placeholder="Masukkan NIPP"
            />
            {errors.nip && (
              <p className="mt-1 text-sm text-red-400">{errors.nip.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="mt-1 block w-full px-3 py-2 pr-10 border border-slate-600 rounded-md shadow-sm bg-slate-800 text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 p-3 rounded-md">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Masuk...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <LogIn className="h-5 w-5" />
                <span>Masuk</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
