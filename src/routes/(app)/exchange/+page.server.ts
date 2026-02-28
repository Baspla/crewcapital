import { db } from '$lib/server/db';
import { exchangePair, exchangeRateHistory, portfolio, portfolioCurrency } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { executeExchange, getExchangeRate } from '$lib/server/exchange';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	// Fetch all exchange pairs
	const pairs = await db.query.exchangePair.findMany({
		with: {
			fromCurrency: true,
			toCurrency: true
		}
	});

	// Compute rates for all pairs
	const pairsWithRates = await Promise.all(
		pairs.map(async (pair) => {
			let rate: number;
			if (pair.staticConversionRate !== null) {
				rate = pair.staticConversionRate;
			} else {
				const latestRate = await db.query.exchangeRateHistory.findFirst({
					where: eq(exchangeRateHistory.pairId, pair.id),
					orderBy: [desc(exchangeRateHistory.date)]
				});
				rate = latestRate ? latestRate.rate : 0;
			}
			return { ...pair, currentRate: rate };
		})
	);

	// Fetch user portfolios and balances
	const userPortfolios = await db.query.portfolio.findMany({
		where: eq(portfolio.userId, user.id),
		with: {
			currencies: {
				with: {
					currency: true
				}
			}
		}
	});

	return {
		pairs: pairsWithRates,
		portfolios: userPortfolios
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const pairId = formData.get('pairId') as string;
		const portfolioId = formData.get('portfolioId') as string;
		const amount = parseFloat(formData.get('amount') as string);
        
        const user = locals.user;

		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		if (!pairId || !portfolioId || isNaN(amount) || amount <= 0) {
			return fail(400, { message: 'Invalid input' });
		}

		try {
			await executeExchange(user.id, portfolioId, pairId, amount);
			return { success: true };
		} catch (e: any) {
			return fail(500, { message: e.message });
		}
	}
};
