import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { getCurrencies } from '$lib/server/data-access/catalog';

export const createUserPortfolio = async (userId: string, name = 'Main Portfolio') => {
	return await db.transaction(async (tx) => {
		const [newPortfolio] = await tx.insert(schema.portfolio).values({
			userId,
			name
		}).returning();

		if (!newPortfolio) throw new Error('Failed to create portfolio');

		const currencies = await getCurrencies();
		const eurCurrency = currencies.find((currency) => currency.id === 'EUR');
		if (!eurCurrency) throw new Error('EUR currency not found');

		for (const currency of currencies) {
			if (currency.id === 'EUR') continue;
			await tx.insert(schema.portfolioCurrency).values({
				portfolioId: newPortfolio.id,
				currencyId: currency.id,
				amount: 0
			});
		}

		await tx.insert(schema.portfolioCurrency).values({
			portfolioId: newPortfolio.id,
			currencyId: eurCurrency.id,
			amount: 100000
		});

		await tx.insert(schema.transaction).values({
			portfolioId: newPortfolio.id,
			type: 'gift',
			totalValue: 100000,
			fromCurrencyId: eurCurrency.id,
			toCurrencyId: eurCurrency.id,
			executedAt: new Date(),
			notes: 'Starting capital'
		});

		console.log(`Created portfolio for user ${userId} with starting gift of 100,000 EUR.`);

		return newPortfolio;
	});
};
