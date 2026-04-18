import { db } from './index';
import * as schema from './schema';
import { appUsers, equipmentCategories, medicalEquipments, railClinicActivities, activityPhotos, handoverRecords, currentUser } from '../lib/rci-data';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🚀 Starting seed process...');

  // Clear existing data to avoid duplicate key errors
  console.log('🧹 Clearing existing data...');
  await db.delete(schema.handoverPhotos);
  await db.delete(schema.handovers);
  await db.delete(schema.activityPhotos);
  await db.delete(schema.railClinicActivities);
  await db.delete(schema.medicalEquipment);
  await db.delete(schema.equipmentCategories);
  await db.delete(schema.userEntityRoles);
  await db.delete(schema.users);
  await db.delete(schema.rolePermissions);
  await db.delete(schema.permissions);
  await db.delete(schema.menus);
  await db.delete(schema.roles);
  await db.delete(schema.entities);
  console.log('✅ Data cleared');

  // 1. Seed Entities
  console.log('🌱 Seeding entities...');
  const mainEntity = await db.insert(schema.entities).values({
    code: 'rail-clinic-pt-kai',
    name: 'Rail Clinic PT KAI',
    type: 'unit',
  }).returning().then(res => res[0]);
  console.log('✅ Entities seeded');

  // 2. Seed Roles
  console.log('🌱 Seeding roles...');
  const roleNames = ['super_admin', 'admin_entity', 'petugas_medis', 'manajemen'];
  const insertedRoles = await db.insert(schema.roles).values(
    roleNames.map(name => ({ code: name, name: name.replace('_', ' '), description: `Role for ${name}` }))
  ).returning();
  console.log('✅ Roles seeded');

  // 3. Seed Users
  console.log('🌱 Seeding users...');
  const userPromises = appUsers.map(async (user) => {
    return db.insert(schema.users).values({
      username: user.username,
      passwordHash: user.password, // In real app, hash this!
      namaLengkap: user.namaLengkap,
      unit: user.unit,
      defaultEntityId: mainEntity.id,
    }).returning();
  });
  const insertedUsers = (await Promise.all(userPromises)).flat();
  console.log('✅ Users seeded');

  // 4. Seed User-Entity-Roles
  console.log('🌱 Seeding user-entity-roles...');
  const userRolePromises = insertedUsers.map(async (user) => {
    const role = insertedRoles.find(r => r.code === (user.roleLegacy || 'petugas_medis'));
    return db.insert(schema.userEntityRoles).values({
      userId: user.id,
      entityId: mainEntity.id,
      roleId: role?.id || insertedRoles[0].id,
    });
  });
  await Promise.all(userRolePromises);
  console.log('✅ User-Entity-Roles seeded');

  // 5. Seed Equipment Categories
  console.log('🌱 Seeding equipment categories...');
  // Mapping mock IDs to codes
  const catMap = {
    'alkes-elektromedis': 'CAT-01',
    'alkes-non-elektromedis': 'CAT-02',
    'perlengkapan-pendukung': 'CAT-03',
  };
  const catValues = Object.entries(catMap).map(([id, code]) => ({
    code,
    name: id.replace(/-/g, ' ').toUpperCase(),
  }));
  const insertedCats = await db.insert(schema.equipmentCategories).values(catValues).returning();
  console.log('✅ Categories seeded');

  // 6. Seed Medical Equipment
  console.log('🌱 Seeding medical equipment...');
  const equipPromises = medicalEquipments.map(async (item) => {
    const cat = insertedCats.find(c => c.code === catMap[item.kategoriId]);
    const user = insertedUsers.find(u => u.username === 'mira.pratama'); // Default creator
    
    return db.insert(schema.medicalEquipment).values({
      categoryId: cat?.id,
      name: item.namaAlat,
      brandType: item.merekTipe,
      acquisitionYear: item.tahunPengadaan,
      lastCalibrationDate: new Date(item.tglKalibrasiTerakhir),
      nextCalibrationDate: new Date(item.tglRencanaKalibrasi),
      status: item.statusKelayakan as any,
      location: item.lokasiPenempatan,
      createdBy: user?.id,
      visualTone: item.visualTone as any,
      calibrationNote: item.keteranganKalibrasi,
      imageUrl: item.imageUrl,
    });
  });
  await Promise.all(equipPromises);
  console.log('✅ Medical Equipment seeded');

  // 7. Seed Activities
  console.log('🌱 Seeding activities...');
  const activityPromises = railClinicActivities.map(async (act) => {
    const user = insertedUsers.find(u => u.username === 'mira.pratama');
    const [insertedAct] = await db.insert(schema.railClinicActivities).values({
      name: act.namaKegiatan,
      date: new Date(act.tanggalKegiatan),
      location: act.lokasiStasiun,
      region: act.wilayahDaop,
      serviceCount: act.jumlahLayanan,
      description: act.keterangan,
      createdBy: user?.id,
    }).returning();

    // Seed Activity Photos
    await Promise.all(act.fotos.map(photo => 
      db.insert(schema.activityPhotos).values({
        activityId: insertedAct.id,
        title: photo.judul,
        focus: photo.fokus,
        tone: photo.tone as any,
        imageUrl: photo.imageUrl,
      })
    ));

    return insertedAct;
  });
  const insertedActs = await Promise.all(activityPromises);
  console.log('✅ Activities and Photos seeded');

  // 8. Seed Handovers
  console.log('🌱 Seeding handovers...');
  const handoverPromises = handoverRecords.map(async (ho) => {
    const sourceAct = insertedActs.find(a => a.name.includes(ho.kegiatanAsal.split(' - ')[0]));
    const targetAct = insertedActs.find(a => a.name.includes(ho.kegiatanTujuan.split(' - ')[0]));
    
    const [insertedHo] = await db.insert(schema.handovers).values({
      sourceActivityId: sourceAct?.id,
      targetActivityId: targetAct?.id,
      handoverDate: new Date(ho.tanggalSerahTerima),
      senderNipp: ho.nippPenyerah,
      senderName: ho.namaPenyerah,
      receiverNipp: ho.nippPenerima,
      receiverName: ho.namaPenerima,
    }).returning();

    await Promise.all(ho.fotos.map(photo => 
      db.insert(schema.handoverPhotos).values({
        handoverId: insertedHo.id,
        title: photo.judul,
        focus: photo.fokus,
        tone: photo.tone as any,
        imageUrl: photo.imageUrl,
      })
    ));
  });
  await Promise.all(handoverPromises);
  console.log('✅ Handovers seeded');

  console.log('🎉 Seed completed successfully!');
}

seed().catch(err => {
  console.error('❌ Seed failed:');
  console.error(err);
  process.exit(1);
});
