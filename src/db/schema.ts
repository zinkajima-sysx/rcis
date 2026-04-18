import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum, AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const statusKelayakanEnum = pgEnum('status_kelayakan', ['Layak Pakai', 'Butuh Perbaikan', 'Rusak / Tidak Layak']);
export const photoToneEnum = pgEnum('photo_tone', ['ocean', 'ember', 'meadow', 'dusk']);

// Entities - using explicit type to avoid circular reference inference issues
export const entities = pgTable('entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull().default('unit'),
  parentId: uuid('parent_id').references((): AnyPgColumn => entities.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  namaLengkap: text('nama_lengkap').notNull(),
  nipp: text('nipp').unique(),
  roleLegacy: text('role_legacy'),
  unit: text('unit'),
  defaultEntityId: uuid('default_entity_id').references((): AnyPgColumn => entities.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Roles
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Menus - using explicit type to avoid circular reference inference issues
export const menus = pgTable('menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => menus.id),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Permissions
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Role Permissions
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references((): AnyPgColumn => roles.id, { onDelete: 'cascade' }),
  menuId: uuid('menu_id').notNull().references((): AnyPgColumn => menus.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references((): AnyPgColumn => permissions.id, { onDelete: 'cascade' }),
  allowed: boolean('allowed').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unq: {
    roleMenuPerm: {
      columns: [t.roleId, t.menuId, t.permissionId],
      unique: true,
    },
  },
}));

// User Entity Roles
export const userEntityRoles = pgTable('user_entity_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id').notNull().references((): AnyPgColumn => entities.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references((): AnyPgColumn => roles.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').notNull().default(true),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unq: {
    userEntityRole: {
      columns: [t.userId, t.entityId, t.roleId],
      unique: true,
    },
  },
}));

// Equipment Categories
export const equipmentCategories = pgTable('equipment_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Medical Equipment
export const medicalEquipment = pgTable('medical_equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references((): AnyPgColumn => equipmentCategories.id),
  name: text('name').notNull(),
  brandType: text('brand_type'),
  acquisitionYear: integer('acquisition_year'),
  lastCalibrationDate: timestamp('last_calibration_date', { withTimezone: true }),
  nextCalibrationDate: timestamp('next_calibration_date', { withTimezone: true }),
  status: statusKelayakanEnum('status').notNull(),
  location: text('location'),
  createdBy: uuid('created_by').references((): AnyPgColumn => users.id),
  visualTone: photoToneEnum('visual_tone'),
  calibrationNote: text('calibration_note'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Rail Clinic Activities
export const railClinicActivities = pgTable('rail_clinic_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  location: text('location').notNull(),
  region: text('region'),
  serviceCount: integer('service_count'),
  description: text('description'),
  createdBy: uuid('created_by').references((): AnyPgColumn => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Activity Photos
export const activityPhotos = pgTable('activity_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').notNull().references((): AnyPgColumn => railClinicActivities.id, { onDelete: 'cascade' }),
  title: text('title'),
  focus: text('focus'),
  tone: photoToneEnum('tone'),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Handovers
export const handovers = pgTable('handovers', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceActivityId: uuid('source_activity_id').references((): AnyPgColumn => railClinicActivities.id),
  targetActivityId: uuid('target_activity_id').references((): AnyPgColumn => railClinicActivities.id),
  handoverDate: timestamp('handover_date', { withTimezone: true }).notNull(),
  senderNipp: text('sender_nipp'),
  senderName: text('sender_name'),
  receiverNipp: text('receiver_nipp'),
  receiverName: text('receiver_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Handover Photos
export const handoverPhotos = pgTable('handover_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  handoverId: uuid('handover_id').notNull().references((): AnyPgColumn => handovers.id, { onDelete: 'cascade' }),
  title: text('title'),
  focus: text('focus'),
  tone: photoToneEnum('tone'),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  entityRoles: many(userEntityRoles),
}));

export const entitiesRelations = relations(entities, ({ many }) => ({
  userRoles: many(userEntityRoles),
}));

export const medicalEquipmentRelations = relations(medicalEquipment, ({ one }) => ({
  category: one(equipmentCategories, {
    fields: [medicalEquipment.categoryId],
    references: [equipmentCategories.id],
  }),
}));

export const railClinicActivitiesRelations = relations(railClinicActivities, ({ many }) => ({
  photos: many(activityPhotos),
}));

export const activityPhotosRelations = relations(activityPhotos, ({ one }) => ({
  activity: one(railClinicActivities, {
    fields: [activityPhotos.activityId],
    references: [railClinicActivities.id],
  }),
}));

export const handoversRelations = relations(handovers, ({ one, many }) => ({
  sourceActivity: one(railClinicActivities, {
    fields: [handovers.sourceActivityId],
    references: [railClinicActivities.id],
  }),
  targetActivity: one(railClinicActivities, {
    fields: [handovers.targetActivityId],
    references: [railClinicActivities.id],
  }),
  photos: many(handoverPhotos),
}));

export const handoverPhotosRelations = relations(handoverPhotos, ({ one }) => ({
  handover: one(handovers, {
    fields: [handoverPhotos.handoverId],
    references: [handovers.id],
  }),
}));
