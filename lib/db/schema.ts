import { relations, sql } from 'drizzle-orm';
import { date, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import type { HakAkses } from '@/lib/permissions';

export const entitas = pgTable('Entitas', {
  id: text('id').primaryKey(),
  kode: text('kode').notNull().unique(),
  nama: text('nama').notNull(),
  hakAkses: jsonb('hak_akses').$type<HakAkses>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const daop = pgTable('Daop', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const kategoriAlkes = pgTable('KategoriAlkes', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const users = pgTable('User', {
  id: text('id').primaryKey(),
  nip: text('nip').notNull().unique(),
  nama: text('nama').notNull(),
  password: text('password').notNull(),
  entitasId: text('entitasId').notNull().references(() => entitas.id),
  daopId: text('daopId').references(() => daop.id),
  berlakuSampai: timestamp('berlaku_sampai'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const alkes = pgTable('Alkes', {
  id: text('id').primaryKey(),
  kode: text('kode').notNull().unique(),
  nama: text('nama').notNull(),
  jumlah: integer('jumlah').notNull().default(0),
  tahunPengadaan: integer('tahunPengadaan'),
  kalibrasiTerakhir: date('kalibrasiTerakhir', { mode: 'date' }),
  jadwalKalibrasi: date('jadwalKalibrasi', { mode: 'date' }),
  kondisi: text('kondisi').notNull(),
  gambarUrl: text('gambarUrl'),
  keterangan: text('keterangan'),
  kategoriId: text('kategoriId').notNull().references(() => kategoriAlkes.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const galeri = pgTable('Galeri', {
  id: text('id').primaryKey(),
  kode: text('kode').notNull().unique(),
  namaKegiatan: text('namaKegiatan').notNull(),
  tanggal: timestamp('tanggal').notNull(),
  daop: text('daop').notNull(),
  lokasi: text('lokasi').notNull(),
  keterangan: text('keterangan'),
  images: text('images').array().notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const handover = pgTable('Handover', {
  id: text('id').primaryKey(),
  kode: text('kode').notNull().unique(),
  judul: text('judul').notNull(),
  tanggal: timestamp('tanggal').notNull(),
  pemberi: text('pemberi').notNull(),
  pemberiNipp: text('pemberiNipp'),
  penerima: text('penerima').notNull(),
  penerimaNipp: text('penerimaNipp'),
  keterangan: text('keterangan'),
  images: text('images').array().notNull(),
  namaKegiatanDari: text('namaKegiatanDari'),
  tanggalKegiatanAsal: date('tanggalKegiatanAsal', { mode: 'date' }),
  wilayahDaopAsal: text('wilayahDaopAsal').references(() => daop.id),
  namaKegiatanKe: text('namaKegiatanKe'),
  tanggalKegiatanKe: date('tanggalKegiatanKe', { mode: 'date' }),
  wilayahDaopKe: text('wilayahDaopKe').references(() => daop.id),
  lokasiStasiun: text('lokasiStasiun'),
  nippPenyerah: text('nippPenyerah'),
  namaPenyerah: text('namaPenyerah'),
  nippPenerima: text('nippPenerima'),
  namaPenerima: text('namaPenerima'),
  tanggalSerahTerima: date('tanggalSerahTerima', { mode: 'date' }),
  fotoSerahTerima: text('fotoSerahTerima'),
  fotoBukti: text('fotoBukti'),
  createdBy: text('createdBy').references(() => users.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const jadwalRC = pgTable('JadwalRC', {
  id: text('id').primaryKey(),
  kode: text('kode').notNull().unique(),
  title: text('title').notNull(),
  date: timestamp('date').notNull(),
  location: text('location').notNull(),
  daop: text('daop').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const entitasRelations = relations(entitas, ({ many }) => ({
  users: many(users),
}));

export const daopRelations = relations(daop, ({ many }) => ({
  users: many(users),
}));

export const kategoriAlkesRelations = relations(kategoriAlkes, ({ many }) => ({
  alkes: many(alkes),
}));

export const usersRelations = relations(users, ({ one }) => ({
  entitas: one(entitas, {
    fields: [users.entitasId],
    references: [entitas.id],
  }),
  daop: one(daop, {
    fields: [users.daopId],
    references: [daop.id],
  }),
}));

export const handoverRelations = relations(handover, ({ one }) => ({
  daopAsal: one(daop, {
    fields: [handover.wilayahDaopAsal],
    references: [daop.id],
    relationName: 'handoverDaopAsal',
  }),
  daopKe: one(daop, {
    fields: [handover.wilayahDaopKe],
    references: [daop.id],
    relationName: 'handoverDaopKe',
  }),
  createdByUser: one(users, {
    fields: [handover.createdBy],
    references: [users.id],
  }),
}));

export const alkesRelations = relations(alkes, ({ one }) => ({
  kategori: one(kategoriAlkes, {
    fields: [alkes.kategoriId],
    references: [kategoriAlkes.id],
  }),
}));

export type Entitas = typeof entitas.$inferSelect;
export type Daop = typeof daop.$inferSelect;
export type KategoriAlkes = typeof kategoriAlkes.$inferSelect;
export type User = typeof users.$inferSelect;
export type Alkes = typeof alkes.$inferSelect;
export type Galeri = typeof galeri.$inferSelect;
export type Handover = typeof handover.$inferSelect;
export type JadwalRC = typeof jadwalRC.$inferSelect;
