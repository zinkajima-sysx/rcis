import { db } from './index';
import * as schema from './schema';

const seedUsers = [
  {
    username: 'superadmin.rcis',
    password: 'change-me-superadmin',
    namaLengkap: 'Superadmin RCIS',
    unit: 'Rail Clinic PT KAI',
    roleCode: 'super_admin',
  },
];

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
  const [mainEntity] = await db.insert(schema.entities).values({
    code: 'rail-clinic-pt-kai',
    name: 'Rail Clinic PT KAI',
    type: 'unit',
  }).returning();
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
  const userPromises = seedUsers.map(async (user) => {
    return db.insert(schema.users).values({
      username: user.username,
      passwordHash: user.password,
      namaLengkap: user.namaLengkap,
      unit: user.unit,
      defaultEntityId: mainEntity.id,
    }).returning();
  });
  const insertedUsers = (await Promise.all(userPromises)).flat();
  console.log('✅ Users seeded');

  // 4. Seed User-Entity-Roles
  console.log('🌱 Seeding user-entity-roles...');
  const userRolePromises = insertedUsers.map(async (user, index) => {
    const role = insertedRoles.find(r => r.code === seedUsers[index]?.roleCode);
    return db.insert(schema.userEntityRoles).values({
      userId: user.id,
      entityId: mainEntity.id,
      roleId: role?.id || insertedRoles[0].id,
    });
  });
  await Promise.all(userRolePromises);
  console.log('✅ User-Entity-Roles seeded');

  console.log('🎉 Seed completed successfully!');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
