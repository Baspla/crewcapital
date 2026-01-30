import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { SCIMPatchOp, SCIMUser } from '$lib/server/scim/types';
import { createSCIMError, userToSCIM, validateBearerToken } from '$lib/server/scim/utils';
import { env } from '$env/dynamic/private';

function getBaseUrl(request: Request): string {
	const url = new URL(request.url);
	return `${url.protocol}//${url.host}`;
}

function authenticate(request: Request): boolean {
	const token = env.SCIM_TOKEN;
	if (!token) {
		console.warn('SCIM_TOKEN not configured - SCIM endpoints are unprotected!');
		return true;
	}
	return validateBearerToken(request, token);
}

/**
 * GET /api/scim/v2/Users/:id
 * Get a single user by ID
 */
export const GET: RequestHandler = async ({ request, params }) => {
	if (!authenticate(request)) {
		return json(createSCIMError(401, 'Unauthorized'), { status: 401 });
	}

	const baseUrl = getBaseUrl(request);
	const id = params.id;

	if (!id) {
		return json(createSCIMError(400, 'User ID is required'), { status: 400 });
	}

	try {
		const dbUser = await db.select().from(user).where(eq(user.id, id)).get();

		if (!dbUser) {
			return json(createSCIMError(404, 'User not found'), { status: 404 });
		}

		return json(userToSCIM(dbUser, baseUrl));
	} catch (e) {
		console.error('SCIM GET User error:', e);
		return json(createSCIMError(500, 'Internal server error'), { status: 500 });
	}
};

/**
 * PUT /api/scim/v2/Users/:id
 * Replace a user
 */
export const PUT: RequestHandler = async ({ request, params }) => {
	if (!authenticate(request)) {
		return json(createSCIMError(401, 'Unauthorized'), { status: 401 });
	}

	const baseUrl = getBaseUrl(request);
	const id = params.id;

	if (!id) {
		return json(createSCIMError(400, 'User ID is required'), { status: 400 });
	}

	try {
		const scimUser: SCIMUser = await request.json();

		// Check if user exists
		const existingUser = await db.select().from(user).where(eq(user.id, id)).get();

		if (!existingUser) {
			return json(createSCIMError(404, 'User not found'), { status: 404 });
		}

		// Extract email
		const primaryEmail =
			scimUser.emails?.find((e) => e.primary)?.value || scimUser.emails?.[0]?.value;
		const email = primaryEmail || scimUser.userName;

		// Update user
		const [updatedUser] = await db
			.update(user)
			.set({
				externalId: scimUser.externalId,
				email: email,
				username: scimUser.userName,
				displayName: scimUser.displayName || scimUser.name?.formatted,
				givenName: scimUser.name?.givenName,
				familyName: scimUser.name?.familyName,
				active: scimUser.active ?? true,
				groups: scimUser.groups?.map((g) => g.display || g.value) || []
			})
			.where(eq(user.id, id))
			.returning();

		return json(userToSCIM(updatedUser, baseUrl));
	} catch (e) {
		console.error('SCIM PUT User error:', e);
		return json(createSCIMError(500, 'Internal server error'), { status: 500 });
	}
};

/**
 * PATCH /api/scim/v2/Users/:id
 * Partially update a user
 */
export const PATCH: RequestHandler = async ({ request, params }) => {
	if (!authenticate(request)) {
		return json(createSCIMError(401, 'Unauthorized'), { status: 401 });
	}

	const baseUrl = getBaseUrl(request);
	const id = params.id;

	if (!id) {
		return json(createSCIMError(400, 'User ID is required'), { status: 400 });
	}

	try {
		const patchOp: SCIMPatchOp = await request.json();

		// Check if user exists
		const existingUser = await db.select().from(user).where(eq(user.id, id)).get();

		if (!existingUser) {
			return json(createSCIMError(404, 'User not found'), { status: 404 });
		}

		// Build update object from patch operations
		const updates: Partial<typeof user.$inferInsert> = {};

		for (const operation of patchOp.Operations) {
			const path = operation.path?.toLowerCase();
			const value = operation.value;

			if (operation.op === 'replace' || operation.op === 'add') {
				if (path === 'active') {
					updates.active = value as boolean;
				} else if (path === 'username') {
					updates.username = value as string;
				} else if (path === 'displayname') {
					updates.displayName = value as string;
				} else if (path === 'name.givenname') {
					updates.givenName = value as string;
				} else if (path === 'name.familyname') {
					updates.familyName = value as string;
				} else if (path === 'externalid') {
					updates.externalId = value as string;
				} else if (path === 'emails' || path === 'emails[type eq "work"].value') {
					if (Array.isArray(value) && value.length > 0) {
						const primaryEmail = value.find((e: { primary?: boolean }) => e.primary) || value[0];
						updates.email = primaryEmail.value;
					} else if (typeof value === 'string') {
						updates.email = value;
					}
				} else if (!path && typeof value === 'object') {
					// Handle direct object replacement
					const obj = value as Record<string, unknown>;
					if ('active' in obj) updates.active = obj.active as boolean;
					if ('userName' in obj) updates.username = obj.userName as string;
					if ('displayName' in obj) updates.displayName = obj.displayName as string;
					if ('externalId' in obj) updates.externalId = obj.externalId as string;
				}
			} else if (operation.op === 'remove') {
				if (path === 'displayname') {
					updates.displayName = null;
				} else if (path === 'name.givenname') {
					updates.givenName = null;
				} else if (path === 'name.familyname') {
					updates.familyName = null;
				}
			}
		}

		// Apply updates if any
		if (Object.keys(updates).length > 0) {
			const [updatedUser] = await db.update(user).set(updates).where(eq(user.id, id)).returning();
			return json(userToSCIM(updatedUser, baseUrl));
		}

		return json(userToSCIM(existingUser, baseUrl));
	} catch (e) {
		console.error('SCIM PATCH User error:', e);
		return json(createSCIMError(500, 'Internal server error'), { status: 500 });
	}
};

/**
 * DELETE /api/scim/v2/Users/:id
 * Delete a user
 */
export const DELETE: RequestHandler = async ({ request, params }) => {
	if (!authenticate(request)) {
		return json(createSCIMError(401, 'Unauthorized'), { status: 401 });
	}

	const id = params.id;

	if (!id) {
		return json(createSCIMError(400, 'User ID is required'), { status: 400 });
	}

	try {
		const existingUser = await db.select().from(user).where(eq(user.id, id)).get();

		if (!existingUser) {
			return json(createSCIMError(404, 'User not found'), { status: 404 });
		}

		await db.delete(user).where(eq(user.id, id));

		return new Response(null, { status: 204 });
	} catch (e) {
		console.error('SCIM DELETE User error:', e);
		return json(createSCIMError(500, 'Internal server error'), { status: 500 });
	}
};
