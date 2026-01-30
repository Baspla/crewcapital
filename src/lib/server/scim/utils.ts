import type { SCIMError, SCIMUser, SCIMMeta } from './types';
import { SCIM_SCHEMAS } from './types';
import type { user } from '$lib/server/db/schema';

type UserRecord = typeof user.$inferSelect;

export function createSCIMError(status: number, detail: string, scimType?: string): SCIMError {
	return {
		schemas: [SCIM_SCHEMAS.ERROR],
		status: status.toString(),
		scimType,
		detail
	};
}

export function userToSCIM(dbUser: UserRecord, baseUrl: string): SCIMUser {
	const meta: SCIMMeta = {
		resourceType: 'User',
		created: dbUser.createdAt?.toISOString(),
		lastModified: dbUser.updatedAt?.toISOString(),
		location: `${baseUrl}/api/scim/v2/Users/${dbUser.id}`
	};

	return {
		schemas: [SCIM_SCHEMAS.USER],
		id: dbUser.id,
		externalId: dbUser.externalId || undefined,
		meta,
		userName: dbUser.username || dbUser.email,
		name: {
			formatted: dbUser.displayName || undefined,
			givenName: dbUser.givenName || undefined,
			familyName: dbUser.familyName || undefined
		},
		displayName: dbUser.displayName || undefined,
		emails: [
			{
				value: dbUser.email,
				type: 'work',
				primary: true
			}
		],
		active: dbUser.active ?? true,
		groups: (dbUser.groups || []).map((g) => ({
			value: g,
			display: g
		}))
	};
}

export function parseSCIMFilter(filter: string | null): { attribute: string; value: string } | null {
	if (!filter) return null;

	// Simple parser for filters like: userName eq "john@example.com"
	const match = filter.match(/^(\w+)\s+eq\s+"([^"]+)"$/i);
	if (match) {
		return {
			attribute: match[1].toLowerCase(),
			value: match[2]
		};
	}

	return null;
}

export function validateBearerToken(request: Request, expectedToken: string): boolean {
	const authHeader = request.headers.get('authorization');
	if (!authHeader) return false;

	const [type, token] = authHeader.split(' ');
	if (type.toLowerCase() !== 'bearer') return false;

	return token === expectedToken;
}
