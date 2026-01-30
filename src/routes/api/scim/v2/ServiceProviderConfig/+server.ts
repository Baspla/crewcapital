import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * GET /api/scim/v2/ServiceProviderConfig
 * Returns the SCIM service provider configuration
 */
export const GET: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	const baseUrl = `${url.protocol}//${url.host}`;

	return json({
		schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
		documentationUri: `${baseUrl}/docs/scim`,
		patch: {
			supported: true
		},
		bulk: {
			supported: false,
			maxOperations: 0,
			maxPayloadSize: 0
		},
		filter: {
			supported: true,
			maxResults: 100
		},
		changePassword: {
			supported: false
		},
		sort: {
			supported: false
		},
		etag: {
			supported: false
		},
		authenticationSchemes: [
			{
				type: 'oauthbearertoken',
				name: 'OAuth Bearer Token',
				description: 'Authentication scheme using the OAuth Bearer Token Standard',
				specUri: 'http://www.rfc-editor.org/info/rfc6750',
				primary: true
			}
		],
		meta: {
			resourceType: 'ServiceProviderConfig',
			location: `${baseUrl}/api/scim/v2/ServiceProviderConfig`
		}
	});
};
