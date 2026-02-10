import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {

	const user = event.locals.user;
	if (!user) {
		throw new Response('Unauthorized', { status: 401 });
	}

	return {
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			groups: typeof user.groups === 'string' ? JSON.parse(user.groups) : (user.groups || []),
			image: user.image,
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
