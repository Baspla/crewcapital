import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * GET /api/scim/v2/ResourceTypes
 * Returns the supported resource types
 */
export const GET: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	const baseUrl = `${url.protocol}//${url.host}`;

	return json({
		schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
		totalResults: 1,
		Resources: [
			{
				schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
				id: 'User',
				name: 'User',
				endpoint: '/Users',
				description: 'User Account',
				schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
				schemaExtensions: [],
				meta: {
					resourceType: 'ResourceType',
					location: `${baseUrl}/api/scim/v2/ResourceTypes/User`
				}
			}
		]
	});
};
