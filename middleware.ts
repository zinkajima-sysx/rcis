import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getJwtSecret } from '@/lib/security';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const ROUTE_MODULES: Array<{ prefix: string; moduleName: string }> = [
  { prefix: '/galeri', moduleName: 'Galeri' },
  { prefix: '/alkes', moduleName: 'Alkes' },
  { prefix: '/handover', moduleName: 'Handover' },
  { prefix: '/jadwal', moduleName: 'JadwalRC' },
  { prefix: '/master/users', moduleName: 'ManajemenUser' },
  { prefix: '/master/daop', moduleName: 'DaopDivre' },
  { prefix: '/master/entitas', moduleName: 'Entitas' },
  { prefix: '/master/kategori', moduleName: 'KategoriAlkes' },
  { prefix: '/master/setting-crud', moduleName: 'SettingCRUD' },
  { prefix: '/', moduleName: 'Dashboard' },
];

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJwtPart<T>(value: string) {
  return JSON.parse(textDecoder.decode(base64UrlToBytes(value))) as T;
}

async function verifyAuthToken(token: string) {
  const [headerPart, payloadPart, signaturePart] = token.split('.');

  if (!headerPart || !payloadPart || !signaturePart) {
    return false;
  }

  try {
    const header = decodeJwtPart<{ alg?: string }>(headerPart);

    if (header.alg !== 'HS256') {
      return false;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(getJwtSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const isValidSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(signaturePart),
      textEncoder.encode(`${headerPart}.${payloadPart}`),
    );

    if (!isValidSignature) {
      return false;
    }

    const payload = decodeJwtPart<{ exp?: number; hak_akses?: Record<string, Record<string, boolean>> }>(payloadPart);
    return (!payload.exp || payload.exp > Math.floor(Date.now() / 1000)) ? payload : null;
  } catch (error) {
    return null;
  }
}

function getRouteModule(pathname: string) {
  return ROUTE_MODULES.find((item) => item.prefix === '/' ? pathname === '/' : pathname.startsWith(item.prefix))?.moduleName;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and login page
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/login') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }

  const routeModule = getRouteModule(pathname);

  if (routeModule && payload.hak_akses?.[routeModule]?.r !== true) {
    const fallbackUrl = payload.hak_akses?.Dashboard?.r === true ? '/' : '/login';
    return NextResponse.redirect(new URL(fallbackUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
