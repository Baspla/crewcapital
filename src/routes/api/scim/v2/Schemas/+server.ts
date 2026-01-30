import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * GET /api/scim/v2/Schemas
 * Returns the supported schemas
 */
export const GET: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	const baseUrl = `${url.protocol}//${url.host}`;

	return json({
		schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
		totalResults: 1,
		Resources: [
			{
				id: 'urn:ietf:params:scim:schemas:core:2.0:User',
				name: 'User',
				description: 'User Account',
				attributes: [
					{
						name: 'userName',
						type: 'string',
						multiValued: false,
						required: true,
						caseExact: false,
						mutability: 'readWrite',
						returned: 'default',
						uniqueness: 'server'
					},
					{
						name: 'name',
						type: 'complex',
						multiValued: false,
						required: false,
						mutability: 'readWrite',
						returned: 'default',
						subAttributes: [
							{
								name: 'formatted',
								type: 'string',
								multiValued: false,
								required: false,
								mutability: 'readWrite',
								returned: 'default'
							},
							{
								name: 'familyName',
								type: 'string',
								multiValued: false,
								required: false,
								mutability: 'readWrite',
								returned: 'default'
							},
							{
								name: 'givenName',
								type: 'string',
								multiValued: false,
								required: false,
								mutability: 'readWrite',
								returned: 'default'
							}
						]
					},
					{
						name: 'displayName',
						type: 'string',
						multiValued: false,
						required: false,
						mutability: 'readWrite',
						returned: 'default'
					},
					{
						name: 'emails',
						type: 'complex',
						multiValued: true,
						required: false,
						mutability: 'readWrite',
						returned: 'default',
						subAttributes: [
							{
								name: 'value',
								type: 'string',
								multiValued: false,
								required: false,
								mutability: 'readWrite',
								returned: 'default'
							},
							{
								name: 'type',
								type: 'string',
								multiValued: false,
								required: false,
								mutability: 'readWrite',
								returned: 'default'
							},
							{
								name: 'primary',
								type: 'boolean',
								multiValued: false,
								required: false,
								mutability: 'readWrite',
								returned: 'default'
							}
						]
					},
					{
						name: 'active',
						type: 'boolean',
						multiValued: false,
						required: false,
						mutability: 'readWrite',
						returned: 'default'
					},
					{
						name: 'groups',
						type: 'complex',
						multiValued: true,
						required: false,
						mutability: 'readOnly',
						returned: 'default',
						subAttributes: [
							{
								name: 'value',
								type: 'string',
								multiValued: false,
								required: false,
								mutability: 'readOnly',
								returned: 'default'
							},
							{
								name: 'display',
								type: 'string',
								multiValued: false,
								required: false,
								mutability: 'readOnly',
								returned: 'default'
							}
						]
					}
				],
				meta: {
					resourceType: 'Schema',
					location: `${baseUrl}/api/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:User`
				}
			}
		]
	});
};
