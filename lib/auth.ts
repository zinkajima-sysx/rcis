import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

// ─── Web Crypto helpers (Edge-runtime & Node.js compatible) ──────────────────

const _textEncoder = new TextEncoder();
const _textDecoder = new TextDecoder();

function _base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  // new Uint8Array(n) selalu menghasilkan Uint8Array<ArrayBuffer> (bukan SharedArrayBuffer)
  // — wajib untuk crypto.subtle di TypeScript 5.9 yang strict soal BufferSource.
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function _verifyJwtToken(token: string): Promise<User | null> {
  try {
    const [headerPart, payloadPart, signaturePart] = token.split('.');

    if (!headerPart || !payloadPart || !signaturePart) {
      return null;
    }

    const header = JSON.parse(
      _textDecoder.decode(_base64UrlToBytes(headerPart)),
    ) as { alg?: string };

    if (header.alg !== 'HS256') {
      return null;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      _textEncoder.encode(getJwtSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const isValidSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      _base64UrlToBytes(signaturePart),
      _textEncoder.encode(`${headerPart}.${payloadPart}`),
    );

    if (!isValidSignature) {
      return null;
    }

    const payload = JSON.parse(
      _textDecoder.decode(_base64UrlToBytes(payloadPart)),
    ) as User & { exp?: number };

    // Cek expiry
    if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ─── Public API (signature identik dengan versi sebelumnya) ──────────────────

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

    return await _verifyJwtToken(token);
  } catch {
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
