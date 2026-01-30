import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/**
 * Debug user configuration for development mode.
 * Set these environment variables to customize the debug user:
 * - DEBUG_USER_ID: External ID (default: 'debug-user-id')
 * - DEBUG_USER_EMAIL: Email (default: 'debug@localhost')
 * - DEBUG_USER_NAME: Username/Display name (default: 'Debug User')
 * - DEBUG_USER_GROUPS: Comma-separated groups (default: 'admin,users')
 */
const DEBUG_USER = {
	externalId: env.DEBUG_USER_ID || 'debug-user-id',
	email: env.DEBUG_USER_EMAIL || 'debug@localhost',
	username: env.DEBUG_USER_NAME || 'Debug User',
	groups: (env.DEBUG_USER_GROUPS || 'admin,users').split(',').map((g) => g.trim())
};

/**
 * Check if we should use the debug user.
 * Only enabled in dev mode when DEBUG_AUTH=true or no proxy headers are present.
 */
function shouldUseDebugAuth(): boolean {
	return dev && env.DEBUG_AUTH === 'true';
}

/**
 * Custom credentials provider that reads authentication data from reverse proxy headers.
 * The reverse proxy (e.g., oauth2-proxy, Authelia, Authentik) handles the OIDC flow
 * and passes user information via HTTP headers.
 */
const HeaderProvider = Credentials({
	id: 'header',
	name: 'Header Auth',
	credentials: {},
	async authorize(credentials, request) {
		// Headers are passed through the request
		const userId = request.headers.get('x-auth-request-user');
		const email = request.headers.get('x-auth-request-email');
		const username = request.headers.get('x-auth-request-preferred-username');
		const groupsHeader = request.headers.get('x-auth-request-groups');

		if (!userId || !email) {
			return null;
		}

		const groups = groupsHeader ? groupsHeader.split(',').map((g) => g.trim()) : [];

		// Find or create user in database
		let dbUser = await db.select().from(user).where(eq(user.externalId, userId)).get();

		if (!dbUser) {
			// Create new user
			const [newUser] = await db
				.insert(user)
				.values({
					externalId: userId,
					email: email,
					username: username || email.split('@')[0],
					displayName: username || email.split('@')[0],
					groups: groups,
					active: true
				})
				.returning();
			dbUser = newUser;
		} else {
			// Update existing user with latest info from IdP
			const [updatedUser] = await db
				.update(user)
				.set({
					email: email,
					username: username || dbUser.username,
					groups: groups
				})
				.where(eq(user.id, dbUser.id))
				.returning();
			dbUser = updatedUser;
		}

		return {
			id: dbUser.id,
			email: dbUser.email,
			name: dbUser.displayName,
			groups: dbUser.groups
		};
	}
});

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [HeaderProvider],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.groups = (user as { groups?: string[] }).groups || [];
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				(session.user as { groups?: string[] }).groups = token.groups as string[];
			}
			return session;
		}
	},
	trustHost: true,
	session: {
		strategy: 'jwt'
	}
});

/**
 * Middleware to automatically authenticate users based on proxy headers.
 * This bypasses the normal Auth.js login flow since authentication
 * is already handled by the reverse proxy.
 *
 * In development mode with DEBUG_AUTH=true, a debug user is automatically created.
 */
export const proxyAuthHandle: Handle = async ({ event, resolve }) => {
	let userId = event.request.headers.get('x-auth-request-user');
	let email = event.request.headers.get('x-auth-request-email');
	let username = event.request.headers.get('x-auth-request-preferred-username');
	let groupsHeader = event.request.headers.get('x-auth-request-groups');

	// In dev mode with DEBUG_AUTH=true, use debug user if no proxy headers present
	if (shouldUseDebugAuth() && !userId) {
		userId = DEBUG_USER.externalId;
		email = DEBUG_USER.email;
		username = DEBUG_USER.username;
		groupsHeader = DEBUG_USER.groups.join(',');

		console.log('[DEBUG AUTH] Using debug user:', DEBUG_USER.email);
	}

	if (userId && email) {
		const groups = groupsHeader ? groupsHeader.split(',').map((g) => g.trim()) : [];

		// Find or create user in database
		let dbUser = await db.select().from(user).where(eq(user.externalId, userId)).get();

		if (!dbUser) {
			const [newUser] = await db
				.insert(user)
				.values({
					externalId: userId,
					email: email,
					username: username || email.split('@')[0],
					displayName: username || email.split('@')[0],
					groups: groups,
					active: true
				})
				.returning();
			dbUser = newUser;
		} else if (dbUser.email !== email || dbUser.username !== username) {
			// Update if info changed
			const [updatedUser] = await db
				.update(user)
				.set({
					email: email,
					username: username || dbUser.username,
					groups: groups
				})
				.where(eq(user.id, dbUser.id))
				.returning();
			dbUser = updatedUser;
		}

		// Set user in locals for access in routes
		event.locals.user = {
			id: dbUser.id,
			externalId: dbUser.externalId,
			email: dbUser.email,
			username: dbUser.username,
			displayName: dbUser.displayName,
			groups: dbUser.groups || [],
			active: dbUser.active
		};
	}

	return resolve(event);
};
