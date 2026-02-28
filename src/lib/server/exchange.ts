import { db } from '$lib/server/db';
import { exchangePair, exchangeRateHistory, portfolio, portfolioCurrency, transaction } from '$lib/server/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function getExchangeRate(pairId: string): Promise<number> {
	const pair = await db.query.exchangePair.findFirst({
		where: eq(exchangePair.id, pairId)
	});

	if (!pair) {
		throw error(404, 'Exchange pair not found');
	}

	if (pair.staticConversionRate !== null) {
		return pair.staticConversionRate;
	}

	const latestRate = await db.query.exchangeRateHistory.findFirst({
		where: eq(exchangeRateHistory.pairId, pairId),
		orderBy: [desc(exchangeRateHistory.date)]
	});

	if (!latestRate) {
		throw error(400, 'No exchange rate available');
	}

	return latestRate.rate;
}

export async function executeExchange(
	userId: string,
	portfolioId: string,
	pairId: string,
	amount: number
) {
	return await db.transaction(async (tx) => {
		// Verify portfolio ownership
		const userPortfolio = await tx.query.portfolio.findFirst({
			where: and(eq(portfolio.id, portfolioId), eq(portfolio.userId, userId))
		});

		if (!userPortfolio) {
			throw error(403, 'Unauthorized portfolio access');
		}

		// Get exchange pair details
		const pair = await tx.query.exchangePair.findFirst({
			where: eq(exchangePair.id, pairId),
			with: {
				fromCurrency: true,
				toCurrency: true
			}
		});

		if (!pair) {
			throw error(404, 'Exchange pair not found');
		}

		// Get Rate (re-implementing getExchangeRate logic within transaction to ensure consistency if needed, 
        // strictly speaking getExchangeRate is read-only so calling it outside is fine, but for atomicity preferably inside or just re-fetch)
		let rate: number;
		if (pair.staticConversionRate !== null) {
			rate = pair.staticConversionRate;
		} else {
			const latestRate = await tx.query.exchangeRateHistory.findFirst({
				where: eq(exchangeRateHistory.pairId, pairId),
				orderBy: [desc(exchangeRateHistory.date)]
			});
			if (!latestRate) {
				throw error(400, 'No exchange rate available');
			}
			rate = latestRate.rate;
		}

		// Check balance
		const sourceBalance = await tx.query.portfolioCurrency.findFirst({
			where: and(
				eq(portfolioCurrency.portfolioId, portfolioId),
				eq(portfolioCurrency.currencyId, pair.fromCurrencyId)
			)
		});

		if (!sourceBalance || sourceBalance.amount < amount) {
			throw error(400, 'Insufficient funds');
		}

		const destinationAmount = amount * rate;

		// Update source balance
		await tx
			.update(portfolioCurrency)
			.set({ amount: sql`${portfolioCurrency.amount} - ${amount}` })
			.where(
				and(
					eq(portfolioCurrency.portfolioId, portfolioId),
					eq(portfolioCurrency.currencyId, pair.fromCurrencyId)
				)
			);

		// Update or create destination balance
		const destBalance = await tx.query.portfolioCurrency.findFirst({
			where: and(
				eq(portfolioCurrency.portfolioId, portfolioId),
				eq(portfolioCurrency.currencyId, pair.toCurrencyId)
			)
		});

		if (destBalance) {
			await tx
				.update(portfolioCurrency)
				.set({ amount: sql`${portfolioCurrency.amount} + ${destinationAmount}` })
				.where(
					and(
						eq(portfolioCurrency.portfolioId, portfolioId),
						eq(portfolioCurrency.currencyId, pair.toCurrencyId)
					)
				);
		} else {
			await tx.insert(portfolioCurrency).values({
				portfolioId,
				currencyId: pair.toCurrencyId,
				amount: destinationAmount
			});
		}

		// Log transaction
		await tx.insert(transaction).values({
			portfolioId,
			type: 'currency_conversion',
			fromCurrencyId: pair.fromCurrencyId,
			toCurrencyId: pair.toCurrencyId,
			amountOfUnits: amount,
			totalValue: destinationAmount,
			conversionRate: rate, // Added conversationRate to schema check implicitly via 'values'
		});
        
        return { success: true, fromAmount: amount, toAmount: destinationAmount, rate };
	});
}
