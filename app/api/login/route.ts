import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { normalizeHakAkses } from '@/lib/permissions';
import { clearLoginRateLimit, consumeLoginRateLimit, getJwtSecret } from '@/lib/security';

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

function getLoginErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('JWT_SECRET')) {
    return {
      status: 500,
      error: 'Konfigurasi server belum lengkap: JWT_SECRET belum diatur atau tidak valid.',
    };
  }

  if (
    message.includes('DATABASE_URL')
    || message.includes('connect')
    || message.includes('ECONN')
    || message.includes('ENOTFOUND')
    || message.includes('password authentication failed')
    || message.includes('certificate')
    || message.includes('postgres')
  ) {
    return {
      status: 500,
      error: 'Koneksi database gagal. Periksa konfigurasi NeonDB/Postgres di server.',
    };
  }

  return {
    status: 500,
    error: 'Terjadi kesalahan server',
  };
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const { nip, username, password } = await request.json();
    const loginId = typeof nip === 'string' && nip.trim()
      ? nip.trim()
      : typeof username === 'string' && username.trim()
        ? username.trim()
        : '';

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'NIPP dan password wajib diisi' },
        { status: 400 }
      );
    }

    const rateLimitKey = `${getClientIp(request)}:${loginId.toLowerCase()}`;
    const rateLimit = consumeLoginRateLimit(rateLimitKey, {
      maxAttempts: LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
      windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Coba lagi beberapa saat lagi.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    // Cari user berdasarkan NIPP
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.nip, loginId),
      with: {
        entitas: true,
        daop: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'NIPP atau password salah' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'NIPP atau password salah' },
        { status: 401 }
      );
    }

    clearLoginRateLimit(rateLimitKey);

    const isSuperadmin = user.entitas.nama.trim().toLowerCase() === 'superadmin';
    const berlakuSampai = user.berlakuSampai ? new Date(user.berlakuSampai) : null;

    if (!isSuperadmin && (!berlakuSampai || berlakuSampai.getTime() < Date.now())) {
      return NextResponse.json(
        { error: 'Masa berlaku user sudah habis atau belum diatur. Hubungi Superadmin.' },
        { status: 403 }
      );
    }

    const hakAkses = normalizeHakAkses(user.entitas.hakAkses);

    // Buat JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        nip: user.nip,
        nama: user.nama,
        berlaku_sampai: user.berlakuSampai?.toISOString() ?? null,
        hak_akses: hakAkses,
        entitas: user.entitas,
        daop: user.daop,
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    // Set cookie dengan token
    const response = NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        nip: user.nip,
        nama: user.nama,
        berlaku_sampai: user.berlakuSampai?.toISOString() ?? null,
        hak_akses: hakAkses,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 jam
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const failure = getLoginErrorResponse(error);
    return NextResponse.json(
      { error: failure.error },
      { status: failure.status }
    );
  }
}
