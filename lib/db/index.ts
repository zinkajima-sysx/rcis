import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL belum diatur.');
}

const globalForDb = globalThis as unknown as {
  postgresClient?: Sql;
};

const client = globalForDb.postgresClient ?? postgres(connectionString, {
  max: 10,            // Naikkan dari 1 → 10 agar request tidak antri
  idle_timeout: 20,   // Tutup koneksi idle setelah 20 detik (baik untuk serverless)
  connect_timeout: 10, // Timeout koneksi awal setelah 10 detik
  prepare: false,     // Wajib false untuk NeonDB Pooler (pgBouncer-compatible)
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
export { client as sqlClient };
