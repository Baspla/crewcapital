import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {

	const user = (await event.parent()).user;

	const portfolio = await db.query.portfolio.findFirst({
		where: eq(schema.portfolio.userId, user!.id),
		with: {
			currencies: {
				with: {
					currency: true
				}
			},
			inventory: {
				with: {
					asset: true
				}
			},
			predictionMarketShares: {
				with: {
					predictionMarket: true,
					currency: true
				}
			}
		}
	});

	if (!portfolio) {
		// Handle case where user has no portfolio.
		// For now, return null or an empty object, or create one.
        // In a real app, maybe redirect to creation flow or create default.
		// Let's return null to handle in UI.
		return { user, portfolio: null };
	}

	return {
		user,
		portfolio
	};
};
