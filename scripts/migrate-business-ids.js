const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

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

function formatBusinessId(prefix, width, value) {
  return `${prefix}-${String(value).padStart(width, '0')}`;
}

async function main() {
  loadRuntimeEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum diatur.');
  }

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
  });

  try {
    const summary = await sql.begin(async (tx) => {
      const result = {
        entitas: [],
        daop: [],
        kategori: [],
        users: [],
        alkes: [],
        galeri: [],
        handover: [],
        jadwal: [],
      };

      const entitasList = await tx`
        select "id", "kode"
        from "Entitas"
        order by "createdAt" asc
      `;
      for (let index = 0; index < entitasList.length; index += 1) {
        const item = entitasList[index];
        const nextId = item.kode || formatBusinessId('ENT', 2, index + 1);
        if (item.id !== nextId || item.kode !== nextId) {
          await tx`
            update "Entitas"
            set "id" = ${nextId}, "kode" = ${nextId}, "updatedAt" = now()
            where "id" = ${item.id}
          `;
          result.entitas.push({ from: item.id, to: nextId });
        }
      }

      const daopList = await tx`
        select "id"
        from "Daop"
        order by "createdAt" asc
      `;
      for (let index = 0; index < daopList.length; index += 1) {
        const item = daopList[index];
        const nextId = String(index + 1);
        if (item.id !== nextId) {
          await tx`
            update "Daop"
            set "id" = ${nextId}, "updatedAt" = now()
            where "id" = ${item.id}
          `;
          result.daop.push({ from: item.id, to: nextId });
        }
      }

      const kategoriList = await tx`
        select "id"
        from "KategoriAlkes"
        order by "createdAt" asc
      `;
      for (let index = 0; index < kategoriList.length; index += 1) {
        const item = kategoriList[index];
        const nextId = formatBusinessId('AK', 2, index + 1);
        if (item.id !== nextId) {
          await tx`
            update "KategoriAlkes"
            set "id" = ${nextId}, "updatedAt" = now()
            where "id" = ${item.id}
          `;
          result.kategori.push({ from: item.id, to: nextId });
        }
      }

      const userList = await tx`
        select "id"
        from "User"
        order by "createdAt" asc
      `;
      for (let index = 0; index < userList.length; index += 1) {
        const item = userList[index];
        const nextId = formatBusinessId('URS', 4, index + 1);
        if (item.id !== nextId) {
          await tx`
            update "User"
            set "id" = ${nextId}, "updatedAt" = now()
            where "id" = ${item.id}
          `;
          result.users.push({ from: item.id, to: nextId });
        }
      }

      const alkesList = await tx`
        select "id", "kode"
        from "Alkes"
        order by "createdAt" asc
      `;
      for (let index = 0; index < alkesList.length; index += 1) {
        const item = alkesList[index];
        const nextId = item.kode || formatBusinessId('AK', 5, index + 1);
        if (item.id !== nextId || item.kode !== nextId) {
          await tx`
            update "Alkes"
            set "id" = ${nextId}, "kode" = ${nextId}, "updatedAt" = now()
            where "id" = ${item.id}
          `;
          result.alkes.push({ from: item.id, to: nextId });
        }
      }

      const galeriList = await tx`
        select "id", "kode"
        from "Galeri"
        order by "createdAt" asc
      `;
      for (let index = 0; index < galeriList.length; index += 1) {
        const item = galeriList[index];
        const nextId = item.kode || formatBusinessId('RC', 6, index + 1);
        if (item.id !== nextId || item.kode !== nextId) {
          await tx`
            update "Galeri"
            set "id" = ${nextId}, "kode" = ${nextId}, "updatedAt" = now()
            where "id" = ${item.id}
          `;
          result.galeri.push({ from: item.id, to: nextId });
        }
      }

      const handoverList = await tx`
        select "id"
        from "Handover"
        order by "createdAt" asc
      `;
      for (let index = 0; index < handoverList.length; index += 1) {
        const item = handoverList[index];
        const nextId = formatBusinessId('ST', 6, index + 1);
        if (item.id !== nextId) {
          await tx`
            update "Handover"
            set "id" = ${nextId}, "updatedAt" = now()
            where "id" = ${item.id}
          `;
          result.handover.push({ from: item.id, to: nextId });
        }
      }

      const jadwalList = await tx`
        select "id", "kode"
        from "JadwalRC"
        order by "createdAt" asc
      `;
      for (let index = 0; index < jadwalList.length; index += 1) {
        const item = jadwalList[index];
        const nextId = formatBusinessId('JRC', 6, index + 1);
        const nextKode = item.kode || formatBusinessId('RC', 6, index + 1);
        if (item.id !== nextId || item.kode !== nextKode) {
          await tx`
            update "JadwalRC"
            set "id" = ${nextId}, "kode" = ${nextKode}, "updatedAt" = now()
            where "id" = ${item.id}
          `;
          result.jadwal.push({ from: item.id, to: nextId });
        }
      }

      return result;
    });

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
