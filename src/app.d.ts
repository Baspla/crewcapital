// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: string;
				externalId: string | null;
				email: string;
				username: string | null;
				displayName: string | null;
				avatarUrl: string | null;
				groups: string[];
				active: boolean | null;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
