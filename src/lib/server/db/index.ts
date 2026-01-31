import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

const client = new Database(building ? ':memory:' : (env.DATABASE_URL ?? 'local.db'));
client.pragma('foreign_keys = ON');

export const db = drizzle(client, { schema });

if (!building) {
	migrate(db, { migrationsFolder: 'drizzle' });
}
