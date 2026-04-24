'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { assertModuleAccess } from '@/lib/auth';
import { buildEntitasHakAkses, MODULES, normalizeHakAkses, type ModuleKey, type PermissionKey } from '@/lib/permissions';
import { db } from '@/lib/db';
import { expectRow } from '@/lib/db/rows';
import { entitas as entitasTable } from '@/lib/db/schema';

const PERMISSION_KEYS: PermissionKey[] = ['c', 'r', 'u', 'd'];

export async function updateEntitasPermission(entitasId: string, modul: ModuleKey, permissionKey: PermissionKey, nextValue: boolean) {
  try {
    await assertModuleAccess('SettingCRUD', 'u');
    if (!MODULES.includes(modul) || !PERMISSION_KEYS.includes(permissionKey)) {
      return { success: false, error: 'Permintaan perubahan hak akses tidak valid.' };
    }

    const entitas = await db.query.entitas.findFirst({
      where: (entitas, { eq }) => eq(entitas.id, entitasId),
    });

    if (!entitas) {
      return { success: false, error: 'Entitas tidak ditemukan.' };
    }

    const hakAkses = normalizeHakAkses(entitas.hakAkses);
    hakAkses[modul][permissionKey] = nextValue;

    const [updatedRow] = await db.update(entitasTable).set({
      hakAkses,
      updatedAt: new Date(),
    }).where(eq(entitasTable.id, entitasId)).returning();
    const updated = expectRow(updatedRow, 'Entitas tidak ditemukan.');

    revalidatePath('/master/setting-crud');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: `Gagal menyimpan hak akses: ${error.message}` };
  }
}

export async function resetEntitasPermissions() {
  try {
    await assertModuleAccess('SettingCRUD', 'u');
    const entitasList = await db.query.entitas.findMany({
      columns: { id: true, nama: true },
    });

    await Promise.all(
      entitasList.map((entitas) =>
        db.update(entitasTable).set({
          hakAkses: buildEntitasHakAkses(entitas.nama),
          updatedAt: new Date(),
        }).where(eq(entitasTable.id, entitas.id)),
      ),
    );

    revalidatePath('/master/setting-crud');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Gagal mereset hak akses: ${error.message}` };
  }
}
