import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';

import { normalizeHakAkses, type HakAkses, type ModuleKey, type PermissionKey } from '@/lib/permissions';
import { getJwtSecret } from '@/lib/security';

export interface User {
  userId: string;
  nip: string;
  nama: string;
  berlaku_sampai?: string | null;
  hak_akses: unknown;
  entitas: unknown;
  daop: unknown;
}

export function getUserHakAkses(user: Pick<User, 'hak_akses'> | null | undefined): HakAkses {
  return normalizeHakAkses(user?.hak_akses);
}

export function canAccessModule(user: Pick<User, 'hak_akses'> | null | undefined, moduleName: ModuleKey, permission: PermissionKey = 'r') {
  return Boolean(getUserHakAkses(user)[moduleName]?.[permission]);
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as User;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireModuleAccess(moduleName: ModuleKey, permission: PermissionKey = 'r') {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  if (!canAccessModule(user, moduleName, permission)) {
    redirect(canAccessModule(user, 'Dashboard', 'r') ? '/' : '/login');
  }

  return user;
}

export async function assertModuleAccess(moduleName: ModuleKey, permission: PermissionKey) {
  const user = await getUser();

  if (!user || !canAccessModule(user, moduleName, permission)) {
    throw new Error('Anda tidak memiliki hak akses untuk aksi ini.');
  }

  return user;
}
