import {
	buyPredictionMarketShares,
	getPredictionMarketData,
	getUserPredictionMarketPositions,
	sellPredictionMarketShares
} from '$lib/server/services/predictions';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const marketId = params.marketId;
	const marketData = await getPredictionMarketData([marketId]);

	if (!marketData || marketData.length === 0) {
		throw error(404, 'Market not found');
	}

	const market = marketData[0].market;
	const history = marketData[0].history;

	// Fetch currency details
	const currencies = await db
		.select()
		.from(schema.currency)
		.where(eq(schema.currency.id, market.currencyId))
		.limit(1);

	const currency = currencies[0];

	let userShares: any[] = [];
	let portfolioBalance: number | null = null;

	if (locals.user) {
		// Find user's portfolio
		// Assuming one portfolio per user for simplicity or default one
		const portfolios = await db
			.select()
			.from(schema.portfolio)
			.where(eq(schema.portfolio.userId, locals.user.id))
			.limit(1);

		if (portfolios.length > 0) {
			const portfolioId = portfolios[0].id;
			userShares = await getUserPredictionMarketPositions(portfolioId, [marketId]);

			const portfolioCurrencies = await db
				.select()
				.from(schema.portfolioCurrency)
				.where(
					and(
						eq(schema.portfolioCurrency.portfolioId, portfolioId),
						eq(schema.portfolioCurrency.currencyId, market.currencyId)
					)
				)
				.limit(1);

			portfolioBalance = portfolioCurrencies[0]?.amount ?? 0;
		}
	}

	return {
		market: { ...market, currency },
		history,
		userShares: userShares.map((s) => ({ ...s, id: s.id })), // ensure serializable
		portfolioBalance,
		user: locals.user
	};
};

export const actions: Actions = {
	buy: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const marketId = formData.get('marketId') as string;
		const amount = parseFloat(formData.get('amount') as string);
		const side = formData.get('side') as 'yes' | 'no';

		if (!marketId || isNaN(amount) || amount <= 0 || (side !== 'yes' && side !== 'no')) {
			return fail(400, { error: 'Invalid input' });
		}

		// Get portfolio
		const portfolios = await db
			.select()
			.from(schema.portfolio)
			.where(eq(schema.portfolio.userId, locals.user.id))
			.limit(1);
		if (portfolios.length === 0) return fail(400, { error: 'No portfolio found' });
		const portfolioId = portfolios[0].id;

		try {
			await buyPredictionMarketShares(marketId, portfolioId, amount, side);
			return { success: true };
		} catch (e: any) {
			console.error(e);
			return fail(500, { error: e.message || 'Failed to buy shares' });
		}
	},
	sell: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const marketId = formData.get('marketId') as string;
		const shareId = formData.get('shareId') as string;
		if (!shareId || !marketId) {
			return fail(400, { error: 'Missing share ID' });
		}

		// Get portfolio
		const portfolios = await db
			.select()
			.from(schema.portfolio)
			.where(eq(schema.portfolio.userId, locals.user.id))
			.limit(1);
		if (portfolios.length === 0) return fail(400, { error: 'No portfolio found' });
		const portfolioId = portfolios[0].id;

		try {
			await sellPredictionMarketShares(marketId, portfolioId, shareId);
			return { success: true };
		} catch (e: any) {
			console.error(e);
			return fail(500, { error: e.message || 'Failed to sell shares' });
		}
	}
};
