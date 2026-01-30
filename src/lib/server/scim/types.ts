/**
 * SCIM 2.0 Type Definitions
 * Based on RFC 7643 and RFC 7644
 */

export interface SCIMListResponse<T> {
	schemas: string[];
	totalResults: number;
	startIndex: number;
	itemsPerPage: number;
	Resources: T[];
}

export interface SCIMError {
	schemas: string[];
	status: string;
	scimType?: string;
	detail: string;
}

export interface SCIMMeta {
	resourceType: string;
	created?: string;
	lastModified?: string;
	location?: string;
	version?: string;
}

export interface SCIMName {
	formatted?: string;
	familyName?: string;
	givenName?: string;
	middleName?: string;
	honorificPrefix?: string;
	honorificSuffix?: string;
}

export interface SCIMEmail {
	value: string;
	type?: string;
	primary?: boolean;
}

export interface SCIMGroup {
	value: string;
	$ref?: string;
	display?: string;
}

export interface SCIMUser {
	schemas: string[];
	id?: string;
	externalId?: string;
	meta?: SCIMMeta;
	userName: string;
	name?: SCIMName;
	displayName?: string;
	emails?: SCIMEmail[];
	active?: boolean;
	groups?: SCIMGroup[];
}

export interface SCIMPatchOp {
	schemas: string[];
	Operations: SCIMPatchOperation[];
}

export interface SCIMPatchOperation {
	op: 'add' | 'remove' | 'replace';
	path?: string;
	value?: unknown;
}

export const SCIM_SCHEMAS = {
	USER: 'urn:ietf:params:scim:schemas:core:2.0:User',
	GROUP: 'urn:ietf:params:scim:schemas:core:2.0:Group',
	LIST_RESPONSE: 'urn:ietf:params:scim:api:messages:2.0:ListResponse',
	PATCH_OP: 'urn:ietf:params:scim:api:messages:2.0:PatchOp',
	ERROR: 'urn:ietf:params:scim:api:messages:2.0:Error'
} as const;
