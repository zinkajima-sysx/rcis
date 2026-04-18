"use server";

import { and, desc, eq } from "drizzle-orm";

import { db } from "../db";
import * as schema from "../db/schema";
import {
  getAssignmentWindowMessage,
  isSuperAdminRole,
  pickPrimaryAssignment,
  toSessionRole,
  type RoleAssignmentWindow,
} from "./access-control";

function toIsoStringOrNull(value?: Date | null) {
  return value ? value.toISOString() : null;
}

export async function loginAction(input: { username: string; password: string }) {
  const { username, password } = input;
  const normalizedUsername = username.trim().toLowerCase();
  const now = new Date();

  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, normalizedUsername))
      .limit(1);

    if (!user || user.passwordHash !== password) {
      return {
        ok: false,
        message: "Username atau password salah. Silakan coba lagi.",
      };
    }

    if (!user.isActive) {
      return {
        ok: false,
        message: "Akun Anda sedang nonaktif. Hubungi administrator.",
      };
    }

    const assignments = await db
      .select({
        roleCode: schema.roles.code,
        roleName: schema.roles.name,
        entityId: schema.userEntityRoles.entityId,
        entityName: schema.entities.name,
        validFrom: schema.userEntityRoles.validFrom,
        validUntil: schema.userEntityRoles.validUntil,
        assignedAt: schema.userEntityRoles.assignedAt,
      })
      .from(schema.userEntityRoles)
      .innerJoin(schema.roles, eq(schema.userEntityRoles.roleId, schema.roles.id))
      .innerJoin(schema.entities, eq(schema.userEntityRoles.entityId, schema.entities.id))
      .where(
        and(
          eq(schema.userEntityRoles.userId, user.id),
          eq(schema.userEntityRoles.isActive, true)
        )
      )
      .orderBy(desc(schema.userEntityRoles.assignedAt));

    const normalizedAssignments: RoleAssignmentWindow[] = assignments.map((assignment) => ({
      ...assignment,
      validFrom: assignment.validFrom,
      validUntil: assignment.validUntil,
      assignedAt: assignment.assignedAt,
    }));

    const selectedAssignment = pickPrimaryAssignment(
      normalizedAssignments,
      user.defaultEntityId,
      now
    );

    const hasLegacySuperAdmin = isSuperAdminRole(user.roleLegacy);

    if (!selectedAssignment && !hasLegacySuperAdmin) {
      return {
        ok: false,
        message: getAssignmentWindowMessage(normalizedAssignments, now),
      };
    }

    const effectiveRole = selectedAssignment?.roleCode || user.roleLegacy || "manajemen";
    const effectiveEntityId = selectedAssignment?.entityId || user.defaultEntityId || null;
    const effectiveEntityName = selectedAssignment?.entityName || user.unit || null;

    return {
      ok: true,
      session: {
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: toSessionRole(effectiveRole),
        unit: effectiveEntityName || "Rail Clinic",
        entityId: effectiveEntityId,
        entityName: effectiveEntityName,
        accessValidFrom: hasLegacySuperAdmin
          ? null
          : toIsoStringOrNull(selectedAssignment?.validFrom),
        accessValidUntil: hasLegacySuperAdmin
          ? null
          : toIsoStringOrNull(selectedAssignment?.validUntil),
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
