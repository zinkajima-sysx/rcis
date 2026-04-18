import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { db } from "./index";
import {
  daopDivre,
  equipmentCategories,
  handoverItems,
  handoverPhotos,
  handovers,
  medicalEquipment,
  railClinicActivities,
  scheduleEquipmentAllocations,
  scheduleGalleryPhotos,
} from "./schema";

type ScheduleStatus = "draft" | "scheduled" | "in_progress" | "completed" | "cancelled";
type AllocationStatus = "planned" | "assigned" | "returned" | "cancelled";
type HandoverStatus = "draft" | "completed" | "cancelled";

type PaginationInput = {
  limit?: number;
  offset?: number;
};

type ScheduleFilters = PaginationInput & {
  entityId?: string;
  daopDivreId?: string;
  statuses?: ScheduleStatus[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

type GalleryFilters = PaginationInput & {
  entityId?: string;
  daopDivreId?: string;
  search?: string;
};

type HandoverFilters = PaginationInput & {
  entityId?: string;
  scheduleId?: string;
  statuses?: HandoverStatus[];
  dateFrom?: string;
  dateTo?: string;
};

function buildWhereClause(conditions: any[]) {
  return conditions.length > 0 ? and(...conditions) : undefined;
}

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

export async function listRcSchedules(filters: ScheduleFilters = {}) {
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const conditions: any[] = [];

  if (filters.entityId) {
    conditions.push(eq(railClinicActivities.entityId, filters.entityId));
  }

  if (filters.daopDivreId) {
    conditions.push(eq(railClinicActivities.daopDivreId, filters.daopDivreId));
  }

  if (filters.statuses?.length) {
    conditions.push(inArray(railClinicActivities.status, filters.statuses));
  }

  if (filters.dateFrom) {
    conditions.push(gte(railClinicActivities.date, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(railClinicActivities.date, filters.dateTo));
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(railClinicActivities.code, term),
        ilike(railClinicActivities.name, term),
        ilike(railClinicActivities.location, term),
        ilike(railClinicActivities.region, term)
      )!
    );
  }

  const whereClause = buildWhereClause(conditions);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: railClinicActivities.id,
        code: railClinicActivities.code,
        name: railClinicActivities.name,
        startDate: railClinicActivities.date,
        endDate: railClinicActivities.endDate,
        stationName: railClinicActivities.location,
        regionSnapshot: railClinicActivities.region,
        status: railClinicActivities.status,
        daopDivreName: daopDivre.name,
      })
      .from(railClinicActivities)
      .innerJoin(daopDivre, eq(railClinicActivities.daopDivreId, daopDivre.id))
      .where(whereClause)
      .orderBy(asc(railClinicActivities.date), asc(railClinicActivities.location))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(railClinicActivities)
      .where(whereClause),
  ]);

  return {
    rows,
    total: totalRows[0]?.total ?? 0,
    limit,
    offset,
  };
}

export async function getDashboardSnapshot(entityId: string, referenceDate = new Date()) {
  const ref = referenceDate.toISOString().slice(0, 10);
  const dueDate = addDays(referenceDate, 30).toISOString().slice(0, 10);

  const [equipmentByStatus, activeSchedules, upcomingSchedules, calibrationAlerts] =
    await Promise.all([
      db
        .select({
          status: medicalEquipment.status,
          total: count(),
        })
        .from(medicalEquipment)
        .where(eq(medicalEquipment.entityId, entityId))
        .groupBy(medicalEquipment.status),
      db
        .select({ total: count() })
        .from(railClinicActivities)
        .where(
          and(
            eq(railClinicActivities.entityId, entityId),
            inArray(railClinicActivities.status, ["scheduled", "in_progress"]),
            lte(railClinicActivities.date, ref),
            or(
              sql`${railClinicActivities.endDate} is null`,
              gte(railClinicActivities.endDate, ref)
            )
          )
        ),
      db
        .select({ total: count() })
        .from(railClinicActivities)
        .where(
          and(
            eq(railClinicActivities.entityId, entityId),
            inArray(railClinicActivities.status, ["scheduled", "in_progress"]),
            gte(railClinicActivities.date, ref)
          )
        ),
      db
        .select({ total: count() })
        .from(medicalEquipment)
        .where(
          and(
            eq(medicalEquipment.entityId, entityId),
            lte(medicalEquipment.nextCalibrationDate, dueDate)
          )
        ),
    ]);

  return {
    equipmentByStatus,
    activeSchedules: activeSchedules[0]?.total ?? 0,
    upcomingSchedules: upcomingSchedules[0]?.total ?? 0,
    calibrationAlerts: calibrationAlerts[0]?.total ?? 0,
  };
}

export async function getCalibrationAlerts(entityId: string, withinDays = 30, limit = 20) {
  const dueDate = addDays(new Date(), withinDays).toISOString().slice(0, 10);

  return db
    .select({
      id: medicalEquipment.id,
      name: medicalEquipment.name,
      brandType: medicalEquipment.brandType,
      status: medicalEquipment.status,
      nextCalibrationDate: medicalEquipment.nextCalibrationDate,
      categoryName: equipmentCategories.name,
    })
    .from(medicalEquipment)
    .leftJoin(equipmentCategories, eq(medicalEquipment.categoryId, equipmentCategories.id))
    .where(
      and(
        eq(medicalEquipment.entityId, entityId),
        lte(medicalEquipment.nextCalibrationDate, dueDate)
      )
    )
    .orderBy(asc(medicalEquipment.nextCalibrationDate))
    .limit(limit);
}

export async function getScheduleEquipmentManifest(
  scheduleId: string,
  statuses: AllocationStatus[] = ["planned", "assigned"]
) {
  return db
    .select({
      scheduleId: scheduleEquipmentAllocations.activityId,
      equipmentId: medicalEquipment.id,
      equipmentCode: medicalEquipment.code,
      equipmentName: medicalEquipment.name,
      brandType: medicalEquipment.brandType,
      equipmentStatus: medicalEquipment.status,
      categoryName: equipmentCategories.name,
      allocationStatus: scheduleEquipmentAllocations.status,
      assignedAt: scheduleEquipmentAllocations.assignedAt,
      note: scheduleEquipmentAllocations.note,
    })
    .from(scheduleEquipmentAllocations)
    .innerJoin(medicalEquipment, eq(scheduleEquipmentAllocations.equipmentId, medicalEquipment.id))
    .leftJoin(equipmentCategories, eq(medicalEquipment.categoryId, equipmentCategories.id))
    .where(
      and(
        eq(scheduleEquipmentAllocations.activityId, scheduleId),
        inArray(scheduleEquipmentAllocations.status, statuses)
      )
    )
    .orderBy(asc(medicalEquipment.name));
}

export async function getScheduleGalleryPage(filters: GalleryFilters = {}) {
  const limit = filters.limit ?? 6;
  const offset = filters.offset ?? 0;
  const conditions: any[] = [eq(railClinicActivities.status, "completed")];

  if (filters.entityId) {
    conditions.push(eq(railClinicActivities.entityId, filters.entityId));
  }

  if (filters.daopDivreId) {
    conditions.push(eq(railClinicActivities.daopDivreId, filters.daopDivreId));
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(railClinicActivities.name, term),
        ilike(railClinicActivities.location, term),
        ilike(railClinicActivities.region, term)
      )!
    );
  }

  const whereClause = buildWhereClause(conditions);

  const [scheduleRows, totalRows] = await Promise.all([
    db
      .select({
        id: railClinicActivities.id,
        name: railClinicActivities.name,
        startDate: railClinicActivities.date,
        stationName: railClinicActivities.location,
        regionSnapshot: railClinicActivities.region,
        daopDivreName: daopDivre.name,
      })
      .from(railClinicActivities)
      .innerJoin(daopDivre, eq(railClinicActivities.daopDivreId, daopDivre.id))
      .where(whereClause)
      .orderBy(desc(railClinicActivities.date))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(railClinicActivities)
      .where(whereClause),
  ]);

  const scheduleIds = scheduleRows.map((row) => row.id);

  const photos =
    scheduleIds.length > 0
      ? await db
          .select({
            scheduleId: scheduleGalleryPhotos.activityId,
            slot: scheduleGalleryPhotos.slot,
            title: scheduleGalleryPhotos.title,
            focus: scheduleGalleryPhotos.focus,
            tone: scheduleGalleryPhotos.tone,
            imageUrl: scheduleGalleryPhotos.imageUrl,
          })
          .from(scheduleGalleryPhotos)
          .where(inArray(scheduleGalleryPhotos.activityId, scheduleIds))
          .orderBy(asc(scheduleGalleryPhotos.activityId), asc(scheduleGalleryPhotos.slot))
      : [];

  return {
    rows: scheduleRows.map((row) => ({
      ...row,
      photos: photos.filter((photo) => photo.scheduleId === row.id),
    })),
    total: totalRows[0]?.total ?? 0,
    limit,
    offset,
  };
}

export async function getHandoverLedger(filters: HandoverFilters = {}) {
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const conditions: any[] = [];

  if (filters.entityId) {
    conditions.push(eq(handovers.entityId, filters.entityId));
  }

  if (filters.scheduleId) {
    conditions.push(
      or(
        eq(handovers.sourceActivityId, filters.scheduleId),
        eq(handovers.targetActivityId, filters.scheduleId)
      )!
    );
  }

  if (filters.statuses?.length) {
    conditions.push(inArray(handovers.status, filters.statuses));
  }

  if (filters.dateFrom) {
    conditions.push(gte(handovers.handoverDate, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(handovers.handoverDate, filters.dateTo));
  }

  const whereClause = buildWhereClause(conditions);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: handovers.id,
        code: handovers.code,
        handoverDate: handovers.handoverDate,
        status: handovers.status,
        senderName: handovers.senderName,
        receiverName: handovers.receiverName,
        sourceScheduleId: handovers.sourceActivityId,
        targetScheduleId: handovers.targetActivityId,
        sourceLocation: handovers.sourceLocation,
        targetLocation: handovers.targetLocation,
        totalItems: count(handoverItems.id),
      })
      .from(handovers)
      .leftJoin(handoverItems, eq(handoverItems.handoverId, handovers.id))
      .where(whereClause)
      .groupBy(handovers.id)
      .orderBy(desc(handovers.handoverDate))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(handovers).where(whereClause),
  ]);

  const handoverIds = rows.map((row) => row.id);
  const photos =
    handoverIds.length > 0
      ? await db
          .select({
            handoverId: handoverPhotos.handoverId,
            photoType: handoverPhotos.photoType,
            title: handoverPhotos.title,
            imageUrl: handoverPhotos.imageUrl,
          })
          .from(handoverPhotos)
          .where(inArray(handoverPhotos.handoverId, handoverIds))
      : [];

  return {
    rows: rows.map((row) => ({
      ...row,
      photos: photos.filter((photo) => photo.handoverId === row.id),
    })),
    total: totalRows[0]?.total ?? 0,
    limit,
    offset,
  };
}
