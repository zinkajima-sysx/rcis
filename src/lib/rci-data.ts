import type {
  AppUser,
  Entity,
  EquipmentCategory,
  HandoverPhoto,
  HandoverRecord,
  MedicalEquipment,
  PhotoTone,
  RailClinicActivity,
  UserRole,
} from "./types";

// IMPORTS - After types are defined
import { db } from '../db';
import * as schema from '../db/schema';
import { and, eq, inArray, aliasedTable } from 'drizzle-orm';

import { referenceDate } from "./constants";
import { isAssignmentActive, toSessionRole } from "./access-control";

function formatDbDate(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toISOString().split("T")[0];
}

// DATABASE FUNCTIONS
export async function getCurrentUser() {
  const [user] = await db.select().from(schema.users).limit(1);
  if (!user) {
    return null;
  }

  const assignments = await db
    .select({
      roleCode: schema.roles.code,
      validFrom: schema.userEntityRoles.validFrom,
      validUntil: schema.userEntityRoles.validUntil,
    })
    .from(schema.userEntityRoles)
    .innerJoin(schema.roles, eq(schema.userEntityRoles.roleId, schema.roles.id))
    .where(
      and(
        eq(schema.userEntityRoles.userId, user.id),
        eq(schema.userEntityRoles.isActive, true)
      )
    );

  const activeAssignment = assignments.find((assignment) =>
    isAssignmentActive(assignment)
  );

  return {
    id: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: toSessionRole(activeAssignment?.roleCode || user.roleLegacy || "manajemen") as UserRole,
  };
}

export async function getUsers(): Promise<AppUser[]> {
  const allUsers = await db.select().from(schema.users);
  
  const results = await Promise.all(allUsers.map(async (user) => {
    const assignments = await db
      .select({
        roleCode: schema.roles.code,
        entityId: schema.userEntityRoles.entityId,
        entityName: schema.entities.name,
        validFrom: schema.userEntityRoles.validFrom,
        validUntil: schema.userEntityRoles.validUntil,
      })
      .from(schema.userEntityRoles)
      .innerJoin(schema.roles, eq(schema.userEntityRoles.roleId, schema.roles.id))
      .innerJoin(schema.entities, eq(schema.userEntityRoles.entityId, schema.entities.id))
      .where(
        and(
          eq(schema.userEntityRoles.userId, user.id),
          eq(schema.userEntityRoles.isActive, true)
        )
      );

    const activeAssignment = assignments.find((a) => isAssignmentActive(a));
    const effectiveRole = activeAssignment?.roleCode || user.roleLegacy || "manajemen";
    const effectiveEntityId = activeAssignment?.entityId || user.defaultEntityId || undefined;
    const effectiveEntityName = activeAssignment?.entityName || user.unit || "";

    return {
      id: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
      nipp: user.nipp,
      role: toSessionRole(effectiveRole) as UserRole,
      unit: effectiveEntityName,
      entityId: effectiveEntityId as string | undefined,
      entityName: effectiveEntityName,
      isActive: user.isActive,
      accessValidFrom: formatDbDate(activeAssignment?.validFrom),
      accessValidUntil: formatDbDate(activeAssignment?.validUntil),
    };
  }));

  return results;
}

export async function getRoles() {
  return await db.select().from(schema.roles);
}

export async function getEntities(): Promise<Entity[]> {
  const entities = await db.select().from(schema.entities);
  return entities.map(entity => ({
    id: entity.id,
    code: entity.code,
    name: entity.name,
    type: entity.type,
    parentId: entity.parentId,
    createdAt: formatDbDate(entity.createdAt),
  }));
}

export async function getDaopDivres() {
  return await db.select().from(schema.daopDivre).orderBy(schema.daopDivre.sortOrder);
}

export async function getEquipmentCategories() {
  const categories = await db.select().from(schema.equipmentCategories);
  return categories.map(cat => ({
    id: cat.code as EquipmentCategory["id"],
    nama: cat.name,
  }));
}

export async function getMedicalEquipments() {
  const homeDaop = aliasedTable(schema.daopDivre, "home_daop");
  const currentDaop = aliasedTable(schema.daopDivre, "current_daop");

  const equipments = await db.select({
    id: schema.medicalEquipment.id,
    code: schema.medicalEquipment.code,
    serialNumber: schema.medicalEquipment.serialNumber,
    kategoriId: schema.equipmentCategories.code,
    namaAlat: schema.medicalEquipment.name,
    merekTipe: schema.medicalEquipment.brandType,
    tahunPengadaan: schema.medicalEquipment.acquisitionYear,
    tglKalibrasiTerakhir: schema.medicalEquipment.lastCalibrationDate,
    tglRencanaKalibrasi: schema.medicalEquipment.nextCalibrationDate,
    statusKelayakan: schema.medicalEquipment.status,
    lokasiPenempatan: schema.medicalEquipment.location,
    createdBy: schema.medicalEquipment.createdBy,
    visualTone: schema.medicalEquipment.visualTone,
    keteranganKalibrasi: schema.medicalEquipment.calibrationNote,
    imageUrl: schema.medicalEquipment.imageUrl,
    entityId: schema.medicalEquipment.entityId,
    entityName: schema.entities.name,
    homeDaopDivreId: schema.medicalEquipment.homeDaopDivreId,
    homeDaopName: homeDaop.name,
    currentDaopDivreId: schema.medicalEquipment.currentDaopDivreId,
    currentDaopName: currentDaop.name,
  })
  .from(schema.medicalEquipment)
  .leftJoin(schema.equipmentCategories, eq(schema.medicalEquipment.categoryId, schema.equipmentCategories.id))
  .leftJoin(schema.entities, eq(schema.medicalEquipment.entityId, schema.entities.id))
  .leftJoin(homeDaop, eq(schema.medicalEquipment.homeDaopDivreId, homeDaop.id))
  .leftJoin(currentDaop, eq(schema.medicalEquipment.currentDaopDivreId, currentDaop.id));

  return equipments
    .filter(item => item.kategoriId !== null) // Filter out items without category
    .map(item => ({
      id: item.id,
      code: item.code,
      serialNumber: item.serialNumber,
      kategoriId: item.kategoriId as EquipmentCategory["id"],
      namaAlat: item.namaAlat,
      merekTipe: item.merekTipe || "",
      tahunPengadaan: item.tahunPengadaan || 0,
      tglKalibrasiTerakhir: formatDbDate(item.tglKalibrasiTerakhir),
      tglRencanaKalibrasi: formatDbDate(item.tglRencanaKalibrasi),
      statusKelayakan: item.statusKelayakan,
      lokasiPenempatan: item.lokasiPenempatan || "",
      createdBy: item.createdBy || "",
      visualTone: (item.visualTone as PhotoTone) || "ocean",
      keteranganKalibrasi: item.keteranganKalibrasi || "",
      imageUrl: item.imageUrl || "",
      entityId: item.entityId,
      entityName: item.entityName,
      homeDaopDivreId: item.homeDaopDivreId,
      homeDaopName: item.homeDaopName,
      currentDaopDivreId: item.currentDaopDivreId,
      currentDaopName: item.currentDaopName,
    }));
}

export async function getRailClinicActivities(): Promise<RailClinicActivity[]> {
  const activities = await db
    .select({
      id: schema.railClinicActivities.id,
      entityId: schema.railClinicActivities.entityId,
      daopDivreId: schema.railClinicActivities.daopDivreId,
      kodeKegiatan: schema.railClinicActivities.code,
      namaKegiatan: schema.railClinicActivities.name,
      tanggalKegiatan: schema.railClinicActivities.date,
      tanggalSelesai: schema.railClinicActivities.endDate,
      lokasiStasiun: schema.railClinicActivities.location,
      wilayahDaop: schema.railClinicActivities.region,
      jumlahLayanan: schema.railClinicActivities.serviceCount,
      status: schema.railClinicActivities.status,
      deskripsi: schema.railClinicActivities.description,
      createdBy: schema.railClinicActivities.createdBy,
    })
    .from(schema.railClinicActivities);

  const activityIds = activities.map((activity) => activity.id);
  const photos = activityIds.length
    ? await db
        .select({
          id: schema.activityPhotos.id,
          activityId: schema.activityPhotos.activityId,
          judul: schema.activityPhotos.title,
          fokus: schema.activityPhotos.focus,
          tone: schema.activityPhotos.tone,
          imageUrl: schema.activityPhotos.imageUrl,
        })
        .from(schema.activityPhotos)
        .where(inArray(schema.activityPhotos.activityId, activityIds))
    : [];

  return activities.map((activity) => ({
    id: activity.id,
    entityId: activity.entityId,
    daopDivreId: activity.daopDivreId,
    kodeKegiatan: activity.kodeKegiatan,
    namaKegiatan: activity.namaKegiatan,
    tanggalKegiatan: formatDbDate(activity.tanggalKegiatan),
    tanggalSelesai: formatDbDate(activity.tanggalSelesai),
    lokasiStasiun: activity.lokasiStasiun,
    wilayahDaop: activity.wilayahDaop || "",
    jumlahLayanan: activity.jumlahLayanan || 0,
    status: activity.status as any,
    deskripsi: activity.deskripsi || "",
    fotos: photos
      .filter((photo) => photo.activityId === activity.id)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((photo) => ({
        id: photo.id,
        judul: photo.judul || "Foto kegiatan",
        fokus: photo.fokus || "",
        tone: (photo.tone as PhotoTone) || "ocean",
        imageUrl: photo.imageUrl,
      })),
    createdBy: activity.createdBy || "",
  }));
}

export async function getHandoverRecords() {
  const records = await db.select().from(schema.handovers);

  return await Promise.all(
    records.map(async (handover) => {
      const photos = await db
        .select()
        .from(schema.handoverPhotos)
        .where(eq(schema.handoverPhotos.handoverId, handover.id));

      return {
        id: handover.id,
        kegiatanAsal: handover.sourceActivityId ?? "",
        kegiatanTujuan: handover.targetActivityId ?? "",
        tanggalSerahTerima: formatDbDate(handover.handoverDate),
        nippPenyerah: handover.senderNipp || "",
        namaPenyerah: handover.senderName || "",
        nippPenerima: handover.receiverNipp || "",
        namaPenerima: handover.receiverName || "",
        fotos: photos.map((photo) => ({
          id: photo.id,
          judul: photo.title || "",
          fokus: photo.description || photo.photoType,
          tone: (photo.tone as PhotoTone) || "ocean",
          imageUrl: photo.imageUrl || "",
        })),
      };
    })
  );
}
