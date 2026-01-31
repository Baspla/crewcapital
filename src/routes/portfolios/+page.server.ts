import { requireAuth } from '$lib/server/guards';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Stellt sicher, dass der User authentifiziert ist
	// Wirft einen Redirect, wenn keine Auth-Header vorhanden sind
	const user = requireAuth(event);

	return {
		user: {
			id: user.id,
			email: user.email,
			username: user.username,
			displayName: user.displayName,
			groups: user.groups,
			avatarUrl: user.avatarUrl,
		},
		portfolio: {
			stocks: [
				{ id: 1, asset: 'AAPL', amount: 10, valueEur: 1500, pricePerUnitEur: 150 },
			],
			commodities: [
				{ id: 2, asset: 'Gold', amount: 5, valueEur: 1200, pricePerUnitEur: 240 },
			],
		}
	};
};
