const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

function loadEnvFile(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (fs.existsSync(envPath)) {
    loadEnvFile(envPath);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum diatur. Tidak bisa memverifikasi dashboard live.');
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

  try {
    const [alkes] = await sql`select count(*)::int as count from "Alkes"`;
    const [galeri] = await sql`select count(*)::int as count from "Galeri"`;
    const [handover] = await sql`select count(*)::int as count from "Handover"`;
    const [users] = await sql`select count(*)::int as count from "User"`;
    const jadwal = await sql`select status, count(*)::int as count from "JadwalRC" group by status order by status`;
    const [jadwalTotal] = await sql`select count(*)::int as count from "JadwalRC"`;
    const latestAlkes = await sql`select kode, nama, kondisi from "Alkes" order by "createdAt" desc limit 5`;

    console.log(JSON.stringify({
      source: 'live-neondb',
      generatedAt: new Date().toISOString(),
      dashboard: {
        totalAlkes: alkes.count,
        totalGaleri: galeri.count,
        totalHandover: handover.count,
        totalUsers: users.count,
        totalJadwal: jadwalTotal.count,
        jadwalByStatus: jadwal,
      },
      latestAlkes,
    }, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
