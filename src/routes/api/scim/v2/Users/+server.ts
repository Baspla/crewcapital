import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq, like } from 'drizzle-orm';
import { SCIM_SCHEMAS, type SCIMListResponse, type SCIMUser } from '$lib/server/scim/types';
import {
	createSCIMError,
	userToSCIM,
	parseSCIMFilter,
	validateBearerToken
} from '$lib/server/scim/utils';
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
 * GET /api/scim/v2/Users
 * List users with optional filtering and pagination
 */
export const GET: RequestHandler = async ({ request, url }) => {
	if (!authenticate(request)) {
		return json(createSCIMError(401, 'Unauthorized'), { status: 401 });
	}

	const baseUrl = getBaseUrl(request);
	const startIndex = Math.max(1, parseInt(url.searchParams.get('startIndex') || '1'));
	const count = Math.min(100, Math.max(1, parseInt(url.searchParams.get('count') || '100')));
	const filter = url.searchParams.get('filter');

	try {
		let query = db.select().from(user);

		// Apply filter if provided
		const parsedFilter = parseSCIMFilter(filter);
		if (parsedFilter) {
			if (parsedFilter.attribute === 'username') {
				query = query.where(eq(user.username, parsedFilter.value)) as typeof query;
			} else if (parsedFilter.attribute === 'externalid') {
				query = query.where(eq(user.externalId, parsedFilter.value)) as typeof query;
			} else if (parsedFilter.attribute === 'email' || parsedFilter.attribute === 'emails.value') {
				query = query.where(eq(user.email, parsedFilter.value)) as typeof query;
			}
		}

		const allUsers = await query;
		const totalResults = allUsers.length;

		// Apply pagination
		const paginatedUsers = allUsers.slice(startIndex - 1, startIndex - 1 + count);

		const response: SCIMListResponse<SCIMUser> = {
			schemas: [SCIM_SCHEMAS.LIST_RESPONSE],
			totalResults,
			startIndex,
			itemsPerPage: paginatedUsers.length,
			Resources: paginatedUsers.map((u) => userToSCIM(u, baseUrl))
		};

		return json(response);
	} catch (e) {
		console.error('SCIM GET Users error:', e);
		return json(createSCIMError(500, 'Internal server error'), { status: 500 });
	}
};

/**
 * POST /api/scim/v2/Users
 * Create a new user
 */
export const POST: RequestHandler = async ({ request }) => {
	if (!authenticate(request)) {
		return json(createSCIMError(401, 'Unauthorized'), { status: 401 });
	}

	const baseUrl = getBaseUrl(request);

	try {
		const scimUser: SCIMUser = await request.json();

		// Validate required fields
		if (!scimUser.userName) {
			return json(createSCIMError(400, 'userName is required', 'invalidValue'), { status: 400 });
		}

		// Extract email from emails array or use userName
		const primaryEmail =
			scimUser.emails?.find((e) => e.primary)?.value || scimUser.emails?.[0]?.value;
		const email = primaryEmail || scimUser.userName;

		// Check if user already exists
		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.get();

		if (existingUser) {
			return json(createSCIMError(409, 'User already exists', 'uniqueness'), { status: 409 });
		}

		// Create user
		const [newUser] = await db
			.insert(user)
			.values({
				externalId: scimUser.externalId,
				email: email,
				username: scimUser.userName,
				displayName: scimUser.displayName || scimUser.name?.formatted,
				givenName: scimUser.name?.givenName,
				familyName: scimUser.name?.familyName,
				active: scimUser.active ?? true,
				groups: scimUser.groups?.map((g) => g.display || g.value) || []
			})
			.returning();

		return json(userToSCIM(newUser, baseUrl), { status: 201 });
	} catch (e) {
		console.error('SCIM POST User error:', e);
		return json(createSCIMError(500, 'Internal server error'), { status: 500 });
	}
};
