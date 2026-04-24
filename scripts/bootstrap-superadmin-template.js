const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const postgres = require('postgres');

const TEMPLATE = {
  nip: '50899',
  nama: 'JON KURNIA',
  password: 'GANTI_PASSWORD_SUPERADMIN',
  daopId: null, // Optional. Biarkan null untuk Superadmin global.
};

const PLACEHOLDER_VALUES = new Set([
  'ISI_NIPP_SUPERADMIN',
  'ISI_NAMA_SUPERADMIN',
  'GANTI_PASSWORD_SUPERADMIN',
]);

function formatBusinessId(prefix, width, value) {
  return `${prefix}-${String(value).padStart(width, '0')}`;
}

function extractBusinessIdNumber(rawValue, prefix) {
  if (!rawValue) {
    return null;
  }

  const normalizedValue = rawValue.trim().toUpperCase();
  const expectedPrefix = `${prefix.toUpperCase()}-`;
  if (!normalizedValue.startsWith(expectedPrefix)) {
    return null;
  }

  const numericPart = normalizedValue.slice(expectedPrefix.length);
  if (!/^\d+$/.test(numericPart)) {
    return null;
  }

  const parsed = Number.parseInt(numericPart, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNextBusinessId(values, prefix, width) {
  const highestValue = values.reduce((currentHighest, item) => {
    const parsedValue = extractBusinessIdNumber(item, prefix);
    return parsedValue === null ? currentHighest : Math.max(currentHighest, parsedValue);
  }, 0);

  return formatBusinessId(prefix, width, highestValue + 1);
}

function loadEnvFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, '$1');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadRuntimeEnv() {
  loadEnvFile('.env');
  loadEnvFile('.env.local');
}

function hasTemplatePlaceholders() {
  return [TEMPLATE.nip, TEMPLATE.nama, TEMPLATE.password].some((value) => PLACEHOLDER_VALUES.has(value));
}

function printInstructions() {
  console.log('');
  console.log('Template user Superadmin siap diisi.');
  console.log('1. Buka file scripts/bootstrap-superadmin-template.js');
  console.log('2. Ganti nilai TEMPLATE.nip, TEMPLATE.nama, dan TEMPLATE.password');
  console.log('3. Opsional: isi TEMPLATE.daopId jika Superadmin perlu terikat ke Daop tertentu');
  console.log('4. Jalankan ulang dengan: npm run user:superadmin:template -- --apply');
  console.log('');
  console.log('Template saat ini:');
  console.log(JSON.stringify(TEMPLATE, null, 2));
}

async function main() {
  loadRuntimeEnv();

  const shouldApply = process.argv.includes('--apply');

  if (!shouldApply || hasTemplatePlaceholders()) {
    printInstructions();
    process.exitCode = shouldApply ? 1 : 0;
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum diatur.');
  }

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
  });

  try {
    const [entitas] = await sql`
      select "id", "nama"
      from "Entitas"
      where lower("nama") = lower(${'Superadmin'})
      limit 1
    `;

    if (!entitas) {
      throw new Error('Entitas "Superadmin" tidak ditemukan di database.');
    }

    let resolvedDaopId = null;
    if (typeof TEMPLATE.daopId === 'string' && TEMPLATE.daopId.trim()) {
      const [daop] = await sql`
        select "id"
        from "Daop"
        where "id" = ${TEMPLATE.daopId.trim()}
        limit 1
      `;

      if (!daop) {
        throw new Error(`Daop dengan id "${TEMPLATE.daopId}" tidak ditemukan.`);
      }

      resolvedDaopId = daop.id;
    }

    const passwordHash = await bcrypt.hash(TEMPLATE.password, 10);
    const existingUsers = await sql`select "id" from "User"`;
    const nextUserId = getNextBusinessId(
      existingUsers.map((item) => item.id),
      'URS',
      4,
    );

    const [user] = await sql`
      insert into "User" ("id", "nip", "nama", "password", "entitasId", "daopId")
      values (${nextUserId}, ${TEMPLATE.nip.trim()}, ${TEMPLATE.nama.trim()}, ${passwordHash}, ${entitas.id}, ${resolvedDaopId})
      on conflict ("nip") do update set
        "nama" = excluded."nama",
        "password" = excluded."password",
        "entitasId" = excluded."entitasId",
        "daopId" = excluded."daopId",
        "updatedAt" = now()
      returning "id", "nip", "nama", "entitasId", "daopId"
    `;

    const [profile] = await sql`
      select u."id", u."nip", u."nama", e."nama" as "entitasNama", d."nama" as "daopNama"
      from "User" u
      join "Entitas" e on e."id" = u."entitasId"
      left join "Daop" d on d."id" = u."daopId"
      where u."id" = ${user.id}
      limit 1
    `;

    console.log('');
    console.log('User Superadmin berhasil disiapkan.');
    console.log(JSON.stringify({
      id: profile.id,
      nip: profile.nip,
      nama: profile.nama,
      entitas: profile.entitasNama,
      daop: profile.daopNama ?? null,
    }, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error('');
  console.error('Gagal menyiapkan user Superadmin.');
  console.error(error.message);
  process.exit(1);
});
