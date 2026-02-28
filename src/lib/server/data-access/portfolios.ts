import { and, count, desc, eq, inArray, type InferInsertModel } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

export const getPortfolios = async (userId: string) => {
	return await db.query.portfolio.findMany({
		where: eq(schema.portfolio.userId, userId),
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
			}
		}
	});
};

export const getPortfolioById = async (id: string) => {
	return await db.query.portfolio.findFirst({
		where: eq(schema.portfolio.id, id),
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
			transactions: {
				orderBy: [desc(schema.transaction.executedAt)],
				limit: 50,
				with: {
					asset: true,
					fromCurrency: true,
					toCurrency: true
				}
			}
		}
	});
};

export const createPortfolio = async (data: InferInsertModel<typeof schema.portfolio>) => {
	return await db.insert(schema.portfolio).values(data).returning();
};

export const updatePortfolio = async (id: string, data: Partial<InferInsertModel<typeof schema.portfolio>>) => {
	return await db.update(schema.portfolio).set(data).where(eq(schema.portfolio.id, id)).returning();
};

export const deletePortfolio = async (id: string) => {
	return await db.delete(schema.portfolio).where(eq(schema.portfolio.id, id)).returning();
};

export const updatePortfolioCurrency = async (portfolioId: string, currencyId: string, amountChange: number) => {
	const existing = await db.query.portfolioCurrency.findFirst({
		where: and(eq(schema.portfolioCurrency.portfolioId, portfolioId), eq(schema.portfolioCurrency.currencyId, currencyId))
	});

	if (existing) {
		return await db
			.update(schema.portfolioCurrency)
			.set({ amount: existing.amount + amountChange })
			.where(eq(schema.portfolioCurrency.id, existing.id))
			.returning();
	}

	return await db
		.insert(schema.portfolioCurrency)
		.values({
			portfolioId,
			currencyId,
			amount: amountChange
		})
		.returning();
};

export const getTransactions = async (portfolioId: string) => {
	return await db.query.transaction.findMany({
		where: eq(schema.transaction.portfolioId, portfolioId),
		orderBy: [desc(schema.transaction.executedAt)],
		with: {
			asset: true,
			fromCurrency: true,
			toCurrency: true,
			predictionWager: true
		}
	});
};

export const getUserTransactions = async (userId: string, page: number = 1, pageSize: number = 10) => {
	const portfolios = await db.query.portfolio.findMany({
		where: eq(schema.portfolio.userId, userId),
		columns: { id: true }
	});

	const portfolioIds = portfolios.map((portfolio) => portfolio.id);

	if (portfolioIds.length === 0) return { transactions: [], totalCount: 0 };

	const whereClause = inArray(schema.transaction.portfolioId, portfolioIds);

	const [total] = await db.select({ count: count() }).from(schema.transaction).where(whereClause);

	const transactions = await db.query.transaction.findMany({
		where: whereClause,
		orderBy: [desc(schema.transaction.executedAt)],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		with: {
			asset: true,
			fromCurrency: true,
			toCurrency: true,
			predictionMarketShare: {
				with: {
					predictionMarket: true
				}
			}
		}
	});

	return { transactions, totalCount: total.count };
};

export const getUserAssetTransactions = async (userId: string, assetId: string, page: number = 1, pageSize: number = 10) => {
	const portfolios = await db.query.portfolio.findMany({
		where: eq(schema.portfolio.userId, userId),
		columns: { id: true }
	});
	const portfolioIds = portfolios.map((portfolio) => portfolio.id);

	if (portfolioIds.length === 0) return { transactions: [], totalCount: 0 };
	const whereClause = and(inArray(schema.transaction.portfolioId, portfolioIds), eq(schema.transaction.assetId, assetId));
	const [total] = await db.select({ count: count() }).from(schema.transaction).where(whereClause);
	const transactions = await db.query.transaction.findMany({
		where: whereClause,
		orderBy: [desc(schema.transaction.executedAt)],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		with: {
			asset: true,
			fromCurrency: true,
			toCurrency: true,
			predictionMarketShare: {
				with: {
					predictionMarket: true
				}
			}
		}
	});
	return { transactions, totalCount: total.count };
};
