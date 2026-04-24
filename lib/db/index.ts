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
  max: 1,
  prepare: false,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
export { client as sqlClient };
