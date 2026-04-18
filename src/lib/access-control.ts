import type { UserRole } from "./types";

export type RoleAssignmentWindow = {
  roleCode: string;
  roleName?: string | null;
  entityId?: string | null;
  entityName?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  assignedAt?: Date | null;
};

function normalizeRoleToken(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function isSuperAdminRole(role?: string | null) {
  const normalized = normalizeRoleToken(role);
  return normalized === "super_admin" || normalized === "superadmin";
}

export function toSessionRole(role?: string | null): UserRole {
  const normalized = normalizeRoleToken(role);

  switch (normalized) {
    case "superadmin":
    case "super_admin":
      return "super_admin";
    case "admin_entity":
    case "admin":
      return "admin";
    case "petugas_medis":
      return "petugas_medis";
    case "manager_unit_kesehatan":
      return "manager_unit_kesehatan";
    case "assman":
      return "assman";
    case "guest":
      return "guest";
    case "manajemen":
    default:
      return "manajemen";
  }
}

export function isAssignmentActive(
  assignment: Pick<RoleAssignmentWindow, "roleCode" | "validFrom" | "validUntil">,
  now = new Date()
) {
  if (isSuperAdminRole(assignment.roleCode)) {
    return true;
  }

  if (assignment.validFrom && assignment.validFrom > now) {
    return false;
  }

  if (assignment.validUntil && assignment.validUntil < now) {
    return false;
  }

  return true;
}

export function pickPrimaryAssignment(
  assignments: RoleAssignmentWindow[],
  defaultEntityId?: string | null,
  now = new Date()
) {
  const superAdminAssignment = assignments.find((assignment) =>
    isSuperAdminRole(assignment.roleCode)
  );

  if (superAdminAssignment) {
    return superAdminAssignment;
  }

  const activeAssignments = assignments.filter((assignment) =>
    isAssignmentActive(assignment, now)
  );

  if (activeAssignments.length === 0) {
    return null;
  }

  const defaultEntityAssignment = defaultEntityId
    ? activeAssignments.find((assignment) => assignment.entityId === defaultEntityId)
    : null;

  return defaultEntityAssignment || activeAssignments[0];
}

export function getAssignmentWindowMessage(
  assignments: RoleAssignmentWindow[],
  now = new Date()
) {
  const nonSuperAssignments = assignments.filter(
    (assignment) => !isSuperAdminRole(assignment.roleCode)
  );

  if (nonSuperAssignments.length === 0) {
    return "Akun belum memiliki assignment akses yang aktif.";
  }

  const nextFutureAssignment = nonSuperAssignments
    .filter((assignment) => assignment.validFrom && assignment.validFrom > now)
    .sort((left, right) => {
      const leftTime = left.validFrom?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightTime = right.validFrom?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })[0];

  if (nextFutureAssignment?.validFrom) {
    return `Akses akun belum aktif. Mulai berlaku pada ${nextFutureAssignment.validFrom.toLocaleString("id-ID")}.`;
  }

  const latestExpiredAssignment = nonSuperAssignments
    .filter((assignment) => assignment.validUntil && assignment.validUntil < now)
    .sort((left, right) => {
      const leftTime = left.validUntil?.getTime() ?? 0;
      const rightTime = right.validUntil?.getTime() ?? 0;
      return rightTime - leftTime;
    })[0];

  if (latestExpiredAssignment?.validUntil) {
    return `Akses akun sudah berakhir pada ${latestExpiredAssignment.validUntil.toLocaleString("id-ID")}.`;
  }

  return "Akses akun Anda tidak aktif untuk saat ini.";
}
