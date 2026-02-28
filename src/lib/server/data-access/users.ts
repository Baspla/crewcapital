import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

export const getUsers = async () => {
	return await db.query.user.findMany();
};

export const getUserById = async (id: string) => {
	return await db.query.user.findFirst({ where: eq(schema.user.id, id) });
};
