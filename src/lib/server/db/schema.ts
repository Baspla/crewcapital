import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	externalId: text('external_id').unique(),
	email: text('email').unique().notNull(),
	username: text('username').unique(),
	displayName: text('display_name'),
	givenName: text('given_name'),
	familyName: text('family_name'),
	active: integer('active', { mode: 'boolean' }).default(true),
	groups: text('groups', { mode: 'json' }).$type<string[]>().default([]),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});
