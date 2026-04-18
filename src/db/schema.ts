import {
  AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const entityTypeEnum = pgEnum("entity_type", ["holding", "unit", "regional", "clinic"]);
export const daopDivreTypeEnum = pgEnum("daop_divre_type", ["daop", "divre"]);
export const statusKelayakanEnum = pgEnum("status_kelayakan", [
  "Layak Pakai",
  "Butuh Perbaikan",
  "Rusak / Tidak Layak",
]);
export const photoToneEnum = pgEnum("photo_tone", ["ocean", "ember", "meadow", "dusk"]);
export const scheduleStatusEnum = pgEnum("schedule_status", [
  "draft",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);
export const allocationStatusEnum = pgEnum("allocation_status", [
  "planned",
  "assigned",
  "returned",
  "cancelled",
]);
export const handoverStatusEnum = pgEnum("handover_status", [
  "draft",
  "completed",
  "cancelled",
]);
export const handoverPhotoTypeEnum = pgEnum("handover_photo_type", [
  "serah_terima",
  "checklist",
]);

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    type: entityTypeEnum("type").notNull().default("unit"),
    parentId: uuid("parent_id").references((): AnyPgColumn => entities.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_entities_parent_id").on(table.parentId)]
);

export const daopDivre = pgTable(
  "daop_divre",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    type: daopDivreTypeEnum("type").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_daop_divre_active_sort").on(table.isActive, table.sortOrder),
    uniqueIndex("ux_daop_divre_name").on(table.name),
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    namaLengkap: text("nama_lengkap").notNull(),
    nipp: text("nipp").unique(),
    roleLegacy: text("role_legacy"),
    unit: text("unit"),
    defaultEntityId: uuid("default_entity_id").references((): AnyPgColumn => entities.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_users_default_entity_id").on(table.defaultEntityId),
    index("idx_users_active_username").on(table.isActive, table.username),
  ]
);

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menus = pgTable(
  "menus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => menus.id),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_menus_parent_sort").on(table.parentId, table.sortOrder),
    index("idx_menus_active_sort").on(table.isActive, table.sortOrder),
  ]
);

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .notNull()
      .references((): AnyPgColumn => roles.id, { onDelete: "cascade" }),
    menuId: uuid("menu_id")
      .notNull()
      .references((): AnyPgColumn => menus.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references((): AnyPgColumn => permissions.id, { onDelete: "cascade" }),
    allowed: boolean("allowed").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_role_permissions_scope").on(
      table.roleId,
      table.menuId,
      table.permissionId
    ),
    index("idx_role_permissions_role_id").on(table.roleId),
    index("idx_role_permissions_menu_id").on(table.menuId),
  ]
);

export const userEntityRoles = pgTable(
  "user_entity_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    entityId: uuid("entity_id")
      .notNull()
      .references((): AnyPgColumn => entities.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references((): AnyPgColumn => roles.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_user_entity_roles_scope").on(table.userId, table.entityId, table.roleId),
    index("idx_user_entity_roles_user_active").on(table.userId, table.isActive),
    index("idx_user_entity_roles_entity_active").on(table.entityId, table.isActive),
    index("idx_user_entity_roles_access_window").on(
      table.userId,
      table.isActive,
      table.validFrom,
      table.validUntil
    ),
  ]
);

export const equipmentCategories = pgTable("equipment_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const medicalEquipment = pgTable(
  "medical_equipment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references((): AnyPgColumn => entities.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id").references((): AnyPgColumn => equipmentCategories.id, {
      onDelete: "restrict",
    }),
    homeDaopDivreId: uuid("home_daop_divre_id").references(
      (): AnyPgColumn => daopDivre.id,
      { onDelete: "set null" }
    ),
    currentDaopDivreId: uuid("current_daop_divre_id").references(
      (): AnyPgColumn => daopDivre.id,
      { onDelete: "set null" }
    ),
    code: text("kode_alat").unique(),
    serialNumber: text("serial_number"),
    name: text("nama_alat").notNull(),
    brandType: text("merek_tipe"),
    acquisitionYear: integer("tahun_pengadaan"),
    lastCalibrationDate: date("tgl_kalibrasi_terakhir"),
    nextCalibrationDate: date("tgl_rencana_kalibrasi"),
    status: statusKelayakanEnum("status_kelayakan").notNull(),
    location: text("lokasi_penempatan"),
    createdBy: uuid("created_by").references((): AnyPgColumn => users.id),
    visualTone: photoToneEnum("visual_tone"),
    calibrationNote: text("keterangan_kalibrasi"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_medical_equipment_entity_status").on(table.entityId, table.status),
    index("idx_medical_equipment_category_id").on(table.categoryId),
    index("idx_medical_equipment_current_daop").on(table.currentDaopDivreId),
    index("idx_medical_equipment_next_calibration").on(
      table.entityId,
      table.nextCalibrationDate
    ),
  ]
);

export const equipmentCalibrationHistory = pgTable(
  "equipment_calibration_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    equipmentId: uuid("equipment_id")
      .notNull()
      .references((): AnyPgColumn => medicalEquipment.id, { onDelete: "cascade" }),
    calibrationDate: date("tanggal_kalibrasi").notNull(),
    nextDueDate: date("tanggal_berikutnya"),
    result: text("hasil"),
    note: text("catatan"),
    createdBy: uuid("created_by").references((): AnyPgColumn => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_equipment_calibration_history_equipment_date").on(
      table.equipmentId,
      table.calibrationDate
    ),
  ]
);

export const railClinicActivities = pgTable(
  "rc_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references((): AnyPgColumn => entities.id, { onDelete: "restrict" }),
    daopDivreId: uuid("daop_divre_id")
      .notNull()
      .references((): AnyPgColumn => daopDivre.id, { onDelete: "restrict" }),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    date: date("start_date").notNull(),
    endDate: date("end_date"),
    location: text("station_name").notNull(),
    region: text("region_snapshot"),
    serviceCount: integer("service_count"),
    status: scheduleStatusEnum("status").notNull().default("scheduled"),
    description: text("description"),
    createdBy: uuid("created_by").references((): AnyPgColumn => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_rc_schedules_entity_status_date").on(table.entityId, table.status, table.date),
    index("idx_rc_schedules_daop_status_date").on(table.daopDivreId, table.status, table.date),
    index("idx_rc_schedules_date_range").on(table.date, table.endDate),
  ]
);

export const scheduleGalleryPhotos = pgTable(
  "schedule_gallery_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("schedule_id")
      .notNull()
      .references((): AnyPgColumn => railClinicActivities.id, { onDelete: "cascade" }),
    slot: smallint("slot").notNull(),
    title: text("title"),
    focus: text("focus"),
    tone: photoToneEnum("tone"),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_schedule_gallery_photos_slot").on(table.activityId, table.slot),
    index("idx_schedule_gallery_photos_schedule").on(table.activityId),
  ]
);

export const activityPhotos = scheduleGalleryPhotos;

export const scheduleEquipmentAllocations = pgTable(
  "schedule_equipment_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("schedule_id")
      .notNull()
      .references((): AnyPgColumn => railClinicActivities.id, { onDelete: "cascade" }),
    equipmentId: uuid("equipment_id")
      .notNull()
      .references((): AnyPgColumn => medicalEquipment.id, { onDelete: "restrict" }),
    status: allocationStatusEnum("status").notNull().default("planned"),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    assignedBy: uuid("assigned_by").references((): AnyPgColumn => users.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_schedule_equipment_allocations").on(table.activityId, table.equipmentId),
    index("idx_schedule_equipment_allocations_schedule_status").on(table.activityId, table.status),
    index("idx_schedule_equipment_allocations_equipment_status").on(table.equipmentId, table.status),
  ]
);

export const handovers = pgTable(
  "handovers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityId: uuid("entity_id")
      .notNull()
      .references((): AnyPgColumn => entities.id, { onDelete: "restrict" }),
    code: text("kode_handover").notNull().unique(),
    sourceActivityId: uuid("source_schedule_id").references(
      (): AnyPgColumn => railClinicActivities.id,
      { onDelete: "set null" }
    ),
    targetActivityId: uuid("target_schedule_id").references(
      (): AnyPgColumn => railClinicActivities.id,
      { onDelete: "set null" }
    ),
    sourceDaopDivreId: uuid("source_daop_divre_id").references(
      (): AnyPgColumn => daopDivre.id,
      { onDelete: "set null" }
    ),
    targetDaopDivreId: uuid("target_daop_divre_id").references(
      (): AnyPgColumn => daopDivre.id,
      { onDelete: "set null" }
    ),
    sourceLocation: text("source_station_name"),
    targetLocation: text("target_station_name"),
    handoverDate: date("tanggal_serah_terima").notNull(),
    status: handoverStatusEnum("status").notNull().default("completed"),
    senderNipp: text("sender_nipp"),
    senderName: text("sender_name"),
    receiverNipp: text("receiver_nipp"),
    receiverName: text("receiver_name"),
    senderUserId: uuid("sender_user_id").references((): AnyPgColumn => users.id),
    receiverUserId: uuid("receiver_user_id").references((): AnyPgColumn => users.id),
    note: text("catatan"),
    createdBy: uuid("created_by").references((): AnyPgColumn => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_handovers_entity_date").on(table.entityId, table.handoverDate),
    index("idx_handovers_source_schedule").on(table.sourceActivityId),
    index("idx_handovers_target_schedule").on(table.targetActivityId),
    index("idx_handovers_status_date").on(table.status, table.handoverDate),
  ]
);

export const handoverItems = pgTable(
  "handover_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handoverId: uuid("handover_id")
      .notNull()
      .references((): AnyPgColumn => handovers.id, { onDelete: "cascade" }),
    equipmentId: uuid("equipment_id")
      .notNull()
      .references((): AnyPgColumn => medicalEquipment.id, { onDelete: "restrict" }),
    conditionStatus: text("kondisi_saat_serah_terima"),
    checklistNotes: text("checklist_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_handover_items_equipment").on(table.handoverId, table.equipmentId),
    index("idx_handover_items_handover").on(table.handoverId),
    index("idx_handover_items_equipment").on(table.equipmentId),
  ]
);

export const handoverPhotos = pgTable(
  "handover_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    handoverId: uuid("handover_id")
      .notNull()
      .references((): AnyPgColumn => handovers.id, { onDelete: "cascade" }),
    photoType: handoverPhotoTypeEnum("photo_type").notNull(),
    title: text("title"),
    description: text("description"),
    tone: photoToneEnum("tone"),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ux_handover_photos_type").on(table.handoverId, table.photoType),
    index("idx_handover_photos_handover").on(table.handoverId),
  ]
);

export const usersRelations = relations(users, ({ many, one }) => ({
  defaultEntity: one(entities, {
    fields: [users.defaultEntityId],
    references: [entities.id],
  }),
  entityRoles: many(userEntityRoles),
  createdSchedules: many(railClinicActivities),
  createdEquipment: many(medicalEquipment),
}));

export const entitiesRelations = relations(entities, ({ many, one }) => ({
  parent: one(entities, {
    relationName: "entity_hierarchy",
    fields: [entities.parentId],
    references: [entities.id],
  }),
  children: many(entities, { relationName: "entity_hierarchy" }),
  userRoles: many(userEntityRoles),
  equipments: many(medicalEquipment),
  schedules: many(railClinicActivities),
  handovers: many(handovers),
}));

export const daopDivreRelations = relations(daopDivre, ({ many }) => ({
  schedules: many(railClinicActivities),
  homeEquipments: many(medicalEquipment, { relationName: "equipment_home_daop" }),
  currentEquipments: many(medicalEquipment, { relationName: "equipment_current_daop" }),
  sourceHandovers: many(handovers, { relationName: "handover_source_daop" }),
  targetHandovers: many(handovers, { relationName: "handover_target_daop" }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userEntityRoles: many(userEntityRoles),
  permissions: many(rolePermissions),
}));

export const menusRelations = relations(menus, ({ many, one }) => ({
  parent: one(menus, {
    fields: [menus.parentId],
    references: [menus.id],
  }),
  children: many(menus),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userEntityRolesRelations = relations(userEntityRoles, ({ one }) => ({
  user: one(users, {
    fields: [userEntityRoles.userId],
    references: [users.id],
  }),
  entity: one(entities, {
    fields: [userEntityRoles.entityId],
    references: [entities.id],
  }),
  role: one(roles, {
    fields: [userEntityRoles.roleId],
    references: [roles.id],
  }),
}));

export const equipmentCategoriesRelations = relations(equipmentCategories, ({ many }) => ({
  equipments: many(medicalEquipment),
}));

export const medicalEquipmentRelations = relations(medicalEquipment, ({ many, one }) => ({
  entity: one(entities, {
    fields: [medicalEquipment.entityId],
    references: [entities.id],
  }),
  category: one(equipmentCategories, {
    fields: [medicalEquipment.categoryId],
    references: [equipmentCategories.id],
  }),
  homeDaopDivre: one(daopDivre, {
    relationName: "equipment_home_daop",
    fields: [medicalEquipment.homeDaopDivreId],
    references: [daopDivre.id],
  }),
  currentDaopDivre: one(daopDivre, {
    relationName: "equipment_current_daop",
    fields: [medicalEquipment.currentDaopDivreId],
    references: [daopDivre.id],
  }),
  calibrationHistory: many(equipmentCalibrationHistory),
  allocations: many(scheduleEquipmentAllocations),
  handoverItems: many(handoverItems),
}));

export const equipmentCalibrationHistoryRelations = relations(
  equipmentCalibrationHistory,
  ({ one }) => ({
    equipment: one(medicalEquipment, {
      fields: [equipmentCalibrationHistory.equipmentId],
      references: [medicalEquipment.id],
    }),
    createdByUser: one(users, {
      fields: [equipmentCalibrationHistory.createdBy],
      references: [users.id],
    }),
  })
);

export const railClinicActivitiesRelations = relations(railClinicActivities, ({ many, one }) => ({
  entity: one(entities, {
    fields: [railClinicActivities.entityId],
    references: [entities.id],
  }),
  daopDivreArea: one(daopDivre, {
    fields: [railClinicActivities.daopDivreId],
    references: [daopDivre.id],
  }),
  photos: many(scheduleGalleryPhotos),
  equipmentAllocations: many(scheduleEquipmentAllocations),
  sourceHandovers: many(handovers, { relationName: "handover_source_schedule" }),
  targetHandovers: many(handovers, { relationName: "handover_target_schedule" }),
}));

export const scheduleGalleryPhotosRelations = relations(scheduleGalleryPhotos, ({ one }) => ({
  schedule: one(railClinicActivities, {
    fields: [scheduleGalleryPhotos.activityId],
    references: [railClinicActivities.id],
  }),
}));

export const scheduleEquipmentAllocationsRelations = relations(
  scheduleEquipmentAllocations,
  ({ one }) => ({
    schedule: one(railClinicActivities, {
      fields: [scheduleEquipmentAllocations.activityId],
      references: [railClinicActivities.id],
    }),
    equipment: one(medicalEquipment, {
      fields: [scheduleEquipmentAllocations.equipmentId],
      references: [medicalEquipment.id],
    }),
    assignedByUser: one(users, {
      fields: [scheduleEquipmentAllocations.assignedBy],
      references: [users.id],
    }),
  })
);

export const handoversRelations = relations(handovers, ({ many, one }) => ({
  entity: one(entities, {
    fields: [handovers.entityId],
    references: [entities.id],
  }),
  sourceActivity: one(railClinicActivities, {
    relationName: "handover_source_schedule",
    fields: [handovers.sourceActivityId],
    references: [railClinicActivities.id],
  }),
  targetActivity: one(railClinicActivities, {
    relationName: "handover_target_schedule",
    fields: [handovers.targetActivityId],
    references: [railClinicActivities.id],
  }),
  sourceDaopDivre: one(daopDivre, {
    relationName: "handover_source_daop",
    fields: [handovers.sourceDaopDivreId],
    references: [daopDivre.id],
  }),
  targetDaopDivre: one(daopDivre, {
    relationName: "handover_target_daop",
    fields: [handovers.targetDaopDivreId],
    references: [daopDivre.id],
  }),
  items: many(handoverItems),
  photos: many(handoverPhotos),
}));

export const handoverItemsRelations = relations(handoverItems, ({ one }) => ({
  handover: one(handovers, {
    fields: [handoverItems.handoverId],
    references: [handovers.id],
  }),
  equipment: one(medicalEquipment, {
    fields: [handoverItems.equipmentId],
    references: [medicalEquipment.id],
  }),
}));

export const handoverPhotosRelations = relations(handoverPhotos, ({ one }) => ({
  handover: one(handovers, {
    fields: [handoverPhotos.handoverId],
    references: [handovers.id],
  }),
}));

export const rcSchedules = railClinicActivities;
