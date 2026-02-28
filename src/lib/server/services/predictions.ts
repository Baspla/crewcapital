import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import {
	calculateBoughtSharesForAmount,
	calculateWholeShareBuyPreview,
	calculateSaleAmountForShares,
	getProbabilityForMarket
} from '$lib/predictions/utils';

export async function createManualPredictionMarket(
	title: string,
	text: string,
	endDate: Date,
	deciderId: string,
	poolSize: number,
	currencyId: string
) {
	return await db.transaction(async (tx) => {
		const marketId = crypto.randomUUID();
		await tx.insert(schema.predictionMarket).values({
			id: marketId,
			type: 'binary_text',
			title,
			text,
			endDate,
			deciderId,
			yesPool: poolSize / 2,
			noPool: poolSize / 2,
			currencyId
		});
		await tx.insert(schema.predictionMarketHistory).values({
			id: crypto.randomUUID(),
			predictionMarketId: marketId,
			yesPool: poolSize / 2,
			noPool: poolSize / 2,
			date: new Date(),
			probability: getProbabilityForMarket(poolSize / 2, poolSize / 2, 'yes')
		});
		return marketId;
	});
}

export async function createAssetPredictionMarket(
	title: string | null,
	assetId: string,
	targetPrice: number,
	direction: 'above' | 'below',
	endDate: Date,
	poolSize: number,
	currencyId: string
) {
	return await db.transaction(async (tx) => {
		const marketId = crypto.randomUUID();
		let marketTitle = title;
		if (!marketTitle) {
			const assetData = await tx.query.asset.findFirst({
				where: eq(schema.asset.id, assetId)
			});
			if (assetData) {
				marketTitle = `Will ${assetData.name} be ${direction} ${targetPrice} by ${endDate.toLocaleDateString()}?`;
			} else {
				marketTitle = `Asset Prediction: ${direction} ${targetPrice}`;
			}
		}

		await tx.insert(schema.predictionMarket).values({
			id: marketId,
			type: 'price_target',
			title: marketTitle,
			assetId,
			targetPrice,
			direction,
			endDate,
			yesPool: poolSize / 2,
			noPool: poolSize / 2,
			currencyId
		});
		await tx.insert(schema.predictionMarketHistory).values({
			id: crypto.randomUUID(),
			predictionMarketId: marketId,
			yesPool: poolSize / 2,
			noPool: poolSize / 2,
			date: new Date(),
			probability: getProbabilityForMarket(poolSize / 2, poolSize / 2, 'yes')
		});
		return marketId;
	});
}

export async function buyPredictionMarketShares(
	marketId: string,
	portfolioId: string,
	amount: number,
	side: 'yes' | 'no'
) {
	return await db.transaction(async (tx) => {
		const markets = await tx
			.select()
			.from(schema.predictionMarket)
			.where(eq(schema.predictionMarket.id, marketId))
			.limit(1);
		if (!markets || markets.length === 0) {
			throw new Error('Market not found');
		}
		const market = markets[0];
		if (market.status !== 'pending') {
			throw new Error('Market is not open for trading');
		}
		const portfolios = await tx.select().from(schema.portfolio).where(eq(schema.portfolio.id, portfolioId)).limit(1);
		if (!portfolios || portfolios.length === 0) {
			throw new Error('Portfolio not found');
		}
		const portfolioCurrencies = await tx
			.select()
			.from(schema.portfolioCurrency)
			.where(
				and(
					eq(schema.portfolioCurrency.portfolioId, portfolioId),
					eq(schema.portfolioCurrency.currencyId, market.currencyId)
				)
			)
			.limit(1);
		if (!portfolioCurrencies || portfolioCurrencies.length === 0) {
			throw new Error('Portfolio does not have the required currency');
		}
		const portfolioCurrency = portfolioCurrencies[0];
		if (portfolioCurrency.amount < amount) {
			throw new Error('Insufficient balance in portfolio currency');
		}
		const buyPreview = calculateWholeShareBuyPreview(
			market.yesPool,
			market.noPool,
			amount,
			side
		);
		if (!buyPreview) {
			throw new Error('Amount is too low to buy at least one whole share');
		}
		const actualSpend = buyPreview.requiredAmount;
		const userShares = buyPreview.wholeShares;
		const { yesPoolAfter, noPoolAfter } = calculateBoughtSharesForAmount(
			market.yesPool,
			market.noPool,
			actualSpend,
			side
		);
		await tx
			.update(schema.predictionMarket)
			.set({
				yesPool: yesPoolAfter,
				noPool: noPoolAfter
			})
			.where(eq(schema.predictionMarket.id, marketId));
		const shareId = crypto.randomUUID();
		await tx.insert(schema.predictionMarketShare).values({
			id: shareId,
			predictionMarketId: marketId,
			portfolioId,
			choice: side,
			amount: userShares,
			currencyId: market.currencyId,
			createdAt: new Date()
		});
		await tx
			.update(schema.portfolioCurrency)
			.set({
				amount: portfolioCurrency.amount - actualSpend
			})
			.where(
				and(
					eq(schema.portfolioCurrency.portfolioId, portfolioId),
					eq(schema.portfolioCurrency.currencyId, market.currencyId)
				)
			);
		await tx.insert(schema.transaction).values({
			id: crypto.randomUUID(),
			portfolioId,
			type: 'prediction_cost',
			totalValue: -actualSpend,
			amountOfUnits: userShares,
			pricePerUnit: actualSpend / userShares,
			fee: 0,
			predictionMarketShareId: shareId,
			notes: `Purchased ${userShares} ${side} shares in prediction market "${market.title}"`,
			fromCurrencyId: market.currencyId,
			toCurrencyId: market.currencyId,
			executedAt: new Date()
		});
		await tx.insert(schema.predictionMarketHistory).values({
			id: crypto.randomUUID(),
			predictionMarketId: marketId,
			yesPool: yesPoolAfter,
			noPool: noPoolAfter,
			date: new Date(),
			probability: getProbabilityForMarket(yesPoolAfter, noPoolAfter, 'yes')
		});
		return { shareId, userShares, spentAmount: actualSpend };
	});
}

export async function sellPredictionMarketShares(marketId: string, portfolioId: string, shareId: string) {
	return await db.transaction(async (tx) => {
		const markets = await tx.select().from(schema.predictionMarket).where(eq(schema.predictionMarket.id, marketId));
		if (!markets || markets.length === 0) {
			throw new Error('Market not found');
		}
		const market = markets[0];
		if (market.status !== 'pending') {
			throw new Error('Market is not open for trading');
		}
		const shares = await tx
			.select()
			.from(schema.predictionMarketShare)
			.where(and(eq(schema.predictionMarketShare.id, shareId), eq(schema.predictionMarketShare.portfolioId, portfolioId)));
		if (!shares || shares.length === 0) {
			throw new Error('Shares not found for this portfolio');
		}
		const share = shares[0];
		const { salePrice, yesPoolAfter, noPoolAfter } = calculateSaleAmountForShares(
			market.yesPool,
			market.noPool,
			share.amount,
			share.choice
		);
		await tx
			.update(schema.predictionMarket)
			.set({
				yesPool: yesPoolAfter,
				noPool: noPoolAfter
			})
			.where(eq(schema.predictionMarket.id, marketId));
		const portfolioCurrencies = await tx
			.select()
			.from(schema.portfolioCurrency)
			.where(
				and(
					eq(schema.portfolioCurrency.portfolioId, portfolioId),
					eq(schema.portfolioCurrency.currencyId, market.currencyId)
				)
			);
		if (!portfolioCurrencies || portfolioCurrencies.length === 0) {
			throw new Error('Portfolio does not have the required currency');
		}
		const portfolioCurrency = portfolioCurrencies[0];
		await tx
			.update(schema.portfolioCurrency)
			.set({
				amount: portfolioCurrency.amount + salePrice
			})
			.where(
				and(
					eq(schema.portfolioCurrency.portfolioId, portfolioId),
					eq(schema.portfolioCurrency.currencyId, market.currencyId)
				)
			);
		await tx.insert(schema.transaction).values({
			id: crypto.randomUUID(),
			portfolioId,
			type: 'prediction_sale',
			totalValue: salePrice,
			amountOfUnits: share.amount,
			pricePerUnit: salePrice / share.amount,
			fee: 0,
			predictionMarketShareId: shareId,
			notes: `Sold ${share.amount.toFixed(4)} ${share.choice} shares in prediction market "${market.title}"`,
			fromCurrencyId: market.currencyId,
			toCurrencyId: market.currencyId,
			executedAt: new Date()
		});
		await tx.delete(schema.predictionMarketShare).where(eq(schema.predictionMarketShare.id, shareId));
		await tx.insert(schema.predictionMarketHistory).values({
			id: crypto.randomUUID(),
			predictionMarketId: marketId,
			yesPool: yesPoolAfter,
			noPool: noPoolAfter,
			date: new Date(),
			probability: getProbabilityForMarket(yesPoolAfter, noPoolAfter, 'yes')
		});
		return { salePrice };
	});
}

export async function resolvePredictionMarket(marketId: string, result: 'yes' | 'no' | 'null') {
	return await db.transaction(async (tx) => {
		const markets = await tx
			.select()
			.from(schema.predictionMarket)
			.where(eq(schema.predictionMarket.id, marketId))
			.limit(1);
		if (!markets || markets.length === 0) {
			throw new Error('Market not found');
		}
		const market = markets[0];
		if (market.status !== 'pending') {
			throw new Error('Market is not open for resolution');
		}
		await tx
			.update(schema.predictionMarket)
			.set({
				status: 'resolved',
				result
			})
			.where(eq(schema.predictionMarket.id, marketId));
		await tx.insert(schema.predictionMarketHistory).values({
			id: crypto.randomUUID(),
			predictionMarketId: marketId,
			yesPool: market.yesPool,
			noPool: market.noPool,
			date: new Date(),
			probability: getProbabilityForMarket(market.yesPool, market.noPool, 'yes')
		});
		if (result === 'yes' || result === 'no') {
			const winningShares = await tx
				.select()
				.from(schema.predictionMarketShare)
				.where(
					and(
						eq(schema.predictionMarketShare.predictionMarketId, marketId),
						eq(schema.predictionMarketShare.choice, result)
					)
				);
			for (const share of winningShares) {
				const payoutPerShare = 1;
				const totalPayout = share.amount * payoutPerShare;
				const portfolioCurrencies = await tx
					.select()
					.from(schema.portfolioCurrency)
					.where(
						and(
							eq(schema.portfolioCurrency.portfolioId, share.portfolioId),
							eq(schema.portfolioCurrency.currencyId, market.currencyId)
						)
					);
				let previousAmount = 0;
				if (!portfolioCurrencies || portfolioCurrencies.length === 0) {
					await tx.insert(schema.portfolioCurrency).values({
						id: crypto.randomUUID(),
						portfolioId: share.portfolioId,
						currencyId: market.currencyId,
						amount: 0
					});
					console.log(`Added currency ${market.currencyId} to portfolio ${share.portfolioId} for payout`);
				} else {
					previousAmount = portfolioCurrencies[0].amount;
				}
				await tx
					.update(schema.portfolioCurrency)
					.set({
						amount: previousAmount + totalPayout
					})
					.where(
						and(
							eq(schema.portfolioCurrency.portfolioId, share.portfolioId),
							eq(schema.portfolioCurrency.currencyId, market.currencyId)
						)
					);
				await tx.insert(schema.transaction).values({
					id: crypto.randomUUID(),
					portfolioId: share.portfolioId,
					type: 'prediction_win',
					totalValue: totalPayout,
					amountOfUnits: share.amount,
					pricePerUnit: payoutPerShare,
					fromCurrencyId: market.currencyId,
					toCurrencyId: market.currencyId,
					executedAt: new Date()
				});
			}
		} else if (result === 'null') {
			const allShares = await tx
				.select()
				.from(schema.predictionMarketShare)
				.where(eq(schema.predictionMarketShare.predictionMarketId, marketId));
			for (const share of allShares) {
				const refundPerShare = 0.5;
				const totalRefund = share.amount * refundPerShare;
				const portfolioCurrencies = await tx
					.select()
					.from(schema.portfolioCurrency)
					.where(
						and(
							eq(schema.portfolioCurrency.portfolioId, share.portfolioId),
							eq(schema.portfolioCurrency.currencyId, market.currencyId)
						)
					);
				let previousAmount = 0;
				if (!portfolioCurrencies || portfolioCurrencies.length === 0) {
					await tx.insert(schema.portfolioCurrency).values({
						id: crypto.randomUUID(),
						portfolioId: share.portfolioId,
						currencyId: market.currencyId,
						amount: 0
					});
					console.log(`Added currency ${market.currencyId} to portfolio ${share.portfolioId} for refund`);
				} else {
					previousAmount = portfolioCurrencies[0].amount;
				}
				await tx
					.update(schema.portfolioCurrency)
					.set({
						amount: previousAmount + totalRefund
					})
					.where(
						and(
							eq(schema.portfolioCurrency.portfolioId, share.portfolioId),
							eq(schema.portfolioCurrency.currencyId, market.currencyId)
						)
					);
				await tx.insert(schema.transaction).values({
					id: crypto.randomUUID(),
					portfolioId: share.portfolioId,
					type: 'prediction_draw',
					totalValue: totalRefund,
					amountOfUnits: share.amount,
					pricePerUnit: refundPerShare,
					fromCurrencyId: market.currencyId,
					toCurrencyId: market.currencyId,
					executedAt: new Date()
				});
			}
		}
	});
}

export async function getPredictionMarketData(marketsIds: string[]) {
	return await db.transaction(async (tx) => {
		const markets = await tx.select().from(schema.predictionMarket).where(inArray(schema.predictionMarket.id, marketsIds));
		const result = [];
		for (const market of markets) {
			const history = await tx
				.select()
				.from(schema.predictionMarketHistory)
				.where(eq(schema.predictionMarketHistory.predictionMarketId, market.id))
				.orderBy(schema.predictionMarketHistory.date);
			result.push({
				market,
				history
			});
		}
		return result;
	});
}

export function abortPredictionMarket() {
	// TODO: Complex logic to revert all shares at their purchase price
}

export async function getPredictionMarkets() {
	const markets = await db.select().from(schema.predictionMarket);

	return { markets, totalCount: markets.length };
}

export function getUserPredictionMarketPositions(portfolioId: string, marketIds?: string[]) {
	const filter = marketIds
		? and(
				eq(schema.predictionMarketShare.portfolioId, portfolioId),
				inArray(schema.predictionMarketShare.predictionMarketId, marketIds)
			)
		: eq(schema.predictionMarketShare.portfolioId, portfolioId);
	return db.select().from(schema.predictionMarketShare).where(filter);
}