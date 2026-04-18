"use server";

import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

export async function loginAction(input: { username: string; password: string }) {
  const { username, password } = input;
  const normalizedUsername = username.trim().toLowerCase();

  try {
    const [user] = await db.select().from(schema.users).where(
      eq(schema.users.username, normalizedUsername)
    );

    if (!user || user.passwordHash !== password) {
      return {
        ok: false,
        message: "Username atau password salah. Silakan coba lagi.",
      };
    }

    return {
      ok: true,
      session: {
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: (user.roleLegacy || 'petugas_medis'),
        unit: user.unit,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      ok: false,
      message: "Terjadi kesalahan pada server saat proses login.",
    };
  }
}
