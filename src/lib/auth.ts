import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "$lib/server/db";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { genericOAuth } from "better-auth/plugins";
import { getRequestEvent } from "$app/server";
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	user: {
		additionalFields: {
			groups: {
				type: "string",
				default: "[]",
			},
		}
	},
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: env.OAUTH_PROVIDER_ID || "generic-oauth",
					clientId: env.OAUTH_CLIENT_ID || "",
					clientSecret: env.OAUTH_CLIENT_SECRET || "",
					discoveryUrl: env.OAUTH_DISCOVERY_URL,
					scopes: ["openid", "profile", "email", "groups"],
					overrideUserInfo: true,
					mapProfileToUser: async (profile) => {
						console.log("OAuth profile:", profile);
						const user = {
							name: profile.display_name || profile.preferred_username || profile.name || profile.email.split('@')[0],
							email: profile.email,
							image: profile.picture,
							emailVerified: profile.email_verified || false,
							groups: JSON.stringify(profile.groups || []),
						}
						console.log("Mapped user:", user);
						return user;
					},
				},
			],
		}),
		sveltekitCookies(getRequestEvent)
	],
	baseURL: env.BETTER_AUTH_URL || "http://localhost:5173"
});
