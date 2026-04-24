'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { assertModuleAccess, getUser } from '@/lib/auth';
import { getNextBusinessId } from '@/lib/business-ids';
import { db } from '@/lib/db';
import { isUniqueViolation } from '@/lib/db/errors';
import { expectRow } from '@/lib/db/rows';
import { users as usersTable } from '@/lib/db/schema';

function mapUser(user: any) {
  return {
    id: user.id,
    nip: user.nip,
    nama: user.nama,
    entitasId: user.entitasId,
    entitasNama: user.entitas?.nama ?? '-',
    daopId: user.daopId ?? '',
    daopNama: user.daop?.nama ?? '-',
    berlakuSampai: user.berlakuSampai ? new Date(user.berlakuSampai).toISOString() : null,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

function normalizeOptionalValue(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getUniqueErrorMessage(error: any) {
  if (!isUniqueViolation(error)) {
    return null;
  }

  const target = String(error?.constraint_name ?? error?.constraint ?? error?.detail ?? '');

  if (target.includes('nip')) {
    return 'NIPP sudah digunakan.';
  }

  return 'Data user harus unik.';
}

async function ensureCanManageTargetUser(id: string) {
  const currentUser = await getUser();
  const isCurrentSuperadmin = String((currentUser?.entitas as { nama?: string } | null)?.nama ?? '').trim().toLowerCase() === 'superadmin';

  if (isCurrentSuperadmin) {
    return null;
  }

  const targetUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, id),
    with: {
      entitas: true,
    },
  });

  if (targetUser?.entitas.nama.trim().toLowerCase() === 'superadmin') {
    return 'User dengan entitas Superadmin hanya boleh dikelola oleh Superadmin.';
  }

  return null;
}

function parseBerlakuSampai(value: FormDataEntryValue | null) {
  const normalized = normalizeOptionalValue(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(`${normalized}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createUser(formData: FormData) {
  try {
    await assertModuleAccess('ManajemenUser', 'c');
    const password = normalizeOptionalValue(formData.get('password'));
    const nip = normalizeOptionalValue(formData.get('nip'));
    const nama = normalizeOptionalValue(formData.get('nama'));
    const entitasId = normalizeOptionalValue(formData.get('entitasId'));
    const daopId = normalizeOptionalValue(formData.get('daopId'));
    const berlakuSampai = parseBerlakuSampai(formData.get('berlakuSampai'));

    if (!password || !nip || !nama || !entitasId) {
      return { success: false, error: 'Password, NIPP, nama, dan entitas wajib diisi.' };
    }

    const entitas = await db.query.entitas.findFirst({
      where: (entitas, { eq }) => eq(entitas.id, entitasId),
    });

    if (!entitas) {
      return { success: false, error: 'Entitas tidak ditemukan.' };
    }

    const isSuperadmin = entitas.nama.trim().toLowerCase() === 'superadmin';
    const currentUser = await getUser();
    const isCurrentSuperadmin = String((currentUser?.entitas as { nama?: string } | null)?.nama ?? '').trim().toLowerCase() === 'superadmin';

    if (isSuperadmin && !isCurrentSuperadmin) {
      return { success: false, error: 'User dengan entitas Superadmin hanya boleh dibuat oleh Superadmin.' };
    }

    if (!isSuperadmin && !berlakuSampai) {
      return { success: false, error: 'Masa berlaku user wajib diisi untuk entitas selain Superadmin.' };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const existingUsers = await db.query.users.findMany({
      columns: { id: true },
    });
    const id = getNextBusinessId(
      existingUsers.map((item) => item.id),
      'URS',
      4,
    );

    await db.insert(usersTable).values({
      id,
      password: passwordHash,
      nip,
      nama,
      entitasId,
      daopId,
      berlakuSampai: isSuperadmin ? null : berlakuSampai,
    });

    const newUserRow = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
      with: {
        entitas: true,
        daop: true,
      },
    });
    const newUser = expectRow(newUserRow, 'User gagal dibuat.');

    revalidatePath('/master/users');
    revalidatePath('/');
    return { success: true, data: mapUser(newUser) };
  } catch (error: any) {
    return { success: false, error: getUniqueErrorMessage(error) ?? `Gagal membuat user: ${error.message}` };
  }
}

export async function updateUser(id: string, formData: FormData) {
  try {
    await assertModuleAccess('ManajemenUser', 'u');
    const protectedError = await ensureCanManageTargetUser(id);

    if (protectedError) {
      return { success: false, error: protectedError };
    }

    const password = normalizeOptionalValue(formData.get('password'));
    const nip = normalizeOptionalValue(formData.get('nip'));
    const nama = normalizeOptionalValue(formData.get('nama'));
    const entitasId = normalizeOptionalValue(formData.get('entitasId'));
    const daopId = normalizeOptionalValue(formData.get('daopId'));
    const berlakuSampai = parseBerlakuSampai(formData.get('berlakuSampai'));

    if (!nip || !nama || !entitasId) {
      return { success: false, error: 'NIPP, nama, dan entitas wajib diisi.' };
    }

    const entitas = await db.query.entitas.findFirst({
      where: (entitas, { eq }) => eq(entitas.id, entitasId),
    });

    if (!entitas) {
      return { success: false, error: 'Entitas tidak ditemukan.' };
    }

    const isSuperadmin = entitas.nama.trim().toLowerCase() === 'superadmin';
    const currentUser = await getUser();
    const isCurrentSuperadmin = String((currentUser?.entitas as { nama?: string } | null)?.nama ?? '').trim().toLowerCase() === 'superadmin';

    if (isSuperadmin && !isCurrentSuperadmin) {
      return { success: false, error: 'User hanya boleh dipindahkan ke entitas Superadmin oleh Superadmin.' };
    }

    if (!isSuperadmin && !berlakuSampai) {
      return { success: false, error: 'Masa berlaku user wajib diisi untuk entitas selain Superadmin.' };
    }

    await db.update(usersTable).set({
      nip,
      nama,
      entitasId,
      daopId,
      berlakuSampai: isSuperadmin ? null : berlakuSampai,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      updatedAt: new Date(),
    }).where(eq(usersTable.id, id));

    const updatedRow = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
      with: {
        entitas: true,
        daop: true,
      },
    });
    const updated = expectRow(updatedRow, 'User tidak ditemukan.');

    revalidatePath('/master/users');
    revalidatePath('/');
    return { success: true, data: mapUser(updated) };
  } catch (error: any) {
    return { success: false, error: getUniqueErrorMessage(error) ?? `Gagal mengubah user: ${error.message}` };
  }
}

export async function deleteUser(id: string) {
  try {
    await assertModuleAccess('ManajemenUser', 'd');
    const protectedError = await ensureCanManageTargetUser(id);

    if (protectedError) {
      return { success: false, error: protectedError };
    }

    await db.delete(usersTable).where(eq(usersTable.id, id));

    revalidatePath('/master/users');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Gagal menghapus user: ${error.message}` };
  }
}
