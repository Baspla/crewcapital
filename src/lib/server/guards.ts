import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Ensures the user is authenticated via the reverse proxy headers.
 * Redirects to a configurable URL if not authenticated.
 *
 * @param event - SvelteKit request event
 * @param redirectTo - URL to redirect unauthenticated users (default: '/oauth2/sign_in')
 */
export function requireAuth(event: RequestEvent, redirectTo = '/oauth2/sign_in') {
	if (!event.locals.user) {
		throw redirect(302, redirectTo);
	}
	return event.locals.user;
}

/**
 * Checks if the user has any of the required groups.
 *
 * @param event - SvelteKit request event
 * @param requiredGroups - Groups that grant access (user needs at least one)
 * @param redirectTo - URL to redirect unauthorized users
 */
export function requireGroups(
	event: RequestEvent,
	requiredGroups: string[],
	redirectTo = '/auth/unauthorized'
) {
	const user = requireAuth(event);

	const hasGroup = requiredGroups.some((group) => user.groups.includes(group));

	if (!hasGroup) {
		throw redirect(302, redirectTo);
	}

	return user;
}

/**
 * Checks if the user has all of the required groups.
 *
 * @param event - SvelteKit request event
 * @param requiredGroups - All groups required for access
 * @param redirectTo - URL to redirect unauthorized users
 */
export function requireAllGroups(
	event: RequestEvent,
	requiredGroups: string[],
	redirectTo = '/auth/unauthorized'
) {
	const user = requireAuth(event);

	const hasAllGroups = requiredGroups.every((group) => user.groups.includes(group));

	if (!hasAllGroups) {
		throw redirect(302, redirectTo);
	}

	return user;
}
