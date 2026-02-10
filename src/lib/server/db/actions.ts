import { eq, and, desc, asc, inArray, count, gte, lte, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { db } from './index';
import * as schema from './schema';
import { fetchHistoricalData, fetchRealTimeData } from '../finance/yahooapi';
import { largestTriangleThreeBuckets } from '../finance/algorithms';
import type { ChartResultArray, ChartResultArrayQuote } from 'yahoo-finance2/modules/chart';

// --- Users ---
export const getUsers = async () => {
    return await db.query.user.findMany();
};

export const getUserById = async (id: string) => {
    return await db.query.user.findFirst({ where: eq(schema.user.id, id) });
};

// --- Asset Categories ---
export const getAssetCategories = async () => {
    return await db.query.assetCategory.findMany();
};

export const createAssetCategory = async (data: InferInsertModel<typeof schema.assetCategory>) => {
    return await db.insert(schema.assetCategory).values(data).returning();
};

export const updateAssetCategory = async (id: string, data: Partial<InferInsertModel<typeof schema.assetCategory>>) => {
    return await db.update(schema.assetCategory).set(data).where(eq(schema.assetCategory.id, id)).returning();
};

export const deleteAssetCategory = async (id: string) => {
    return await db.delete(schema.assetCategory).where(eq(schema.assetCategory.id, id)).returning();
};

// --- Currencies ---
export const getCurrencies = async () => {
    return await db.query.currency.findMany();
};

export const createCurrency = async (data: InferInsertModel<typeof schema.currency>) => {
    return await db.insert(schema.currency).values(data).returning();
};

export const updateCurrency = async (id: string, data: Partial<InferInsertModel<typeof schema.currency>>) => {
    return await db.update(schema.currency).set(data).where(eq(schema.currency.id, id)).returning();
};

export const deleteCurrency = async (id: string) => {
    return await db.delete(schema.currency).where(eq(schema.currency.id, id)).returning();
};

// --- Assets ---
export const getAssets = async () => {
    return await db.query.asset.findMany({
        with: {
            category: true,
            currency: true
        }
    });
};

export const getAssetsPaginated = async (page: number = 1, pageSize: number = 10) => {
    const offset = (page - 1) * pageSize;
    const [assets, totalResult] = await Promise.all([
        db.query.asset.findMany({
            with: {
                category: true,
                currency: true
            },
            limit: pageSize,
            offset: offset,
            orderBy: [desc(schema.asset.createdAt)]
        }),
        db.select({ count: count() }).from(schema.asset)
    ]);

    return {
        assets,
        totalCount: totalResult[0]?.count ?? 0
    };
};

export const getAssetById = async (id: string) => {
    return await db.query.asset.findFirst({
        where: eq(schema.asset.id, id),
        with: {
            category: true,
            currency: true
        }
    });
};


export const getAssetBySymbol = async (symbol: string) => {
    return await db.query.asset.findFirst({
        where: eq(schema.asset.symbol, symbol),
        with: {
            category: true,
            currency: true
        }
    });
};

export const createAsset = async (data: InferInsertModel<typeof schema.asset>) => {
    return await db.insert(schema.asset).values(data).returning();
};

export const updateAsset = async (id: string, data: Partial<InferInsertModel<typeof schema.asset>>) => {
    return await db.update(schema.asset).set(data).where(eq(schema.asset.id, id)).returning();
};

export const deleteAsset = async (id: string) => {
    return await db.delete(schema.asset).where(eq(schema.asset.id, id)).returning();
};

// --- Asset Price History ---
export const addAssetPriceHistory = async (data: InferInsertModel<typeof schema.assetPriceHistory>) => {
    return await db.insert(schema.assetPriceHistory).values(data).returning();
};

export const bulkAddAssetPriceHistory = async (data: InferInsertModel<typeof schema.assetPriceHistory>[]) => {
    if (data.length === 0) return [];
    return await db.insert(schema.assetPriceHistory).values(data).returning();
};

export const getAssetPriceHistory = async (assetId: string, startDate?: Date, endDate?: Date, limit: number = 300) => {
    const conditions = [eq(schema.assetPriceHistory.assetId, assetId)];

    if (startDate) {
        conditions.push(gte(schema.assetPriceHistory.date, startDate));
    }

    if (endDate) {
        conditions.push(lte(schema.assetPriceHistory.date, endDate));
    }

    const data = await db.query.assetPriceHistory.findMany({
        where: and(...conditions),
        orderBy: [asc(schema.assetPriceHistory.date)]
    });

    if (data.length <= limit) {
        return data;
    }

    return largestTriangleThreeBuckets(data, limit);
};

export const existsAssetPriceHistory = async (assetId: string, date: Date) => {
    const existing = await db.query.assetPriceHistory.findFirst({
        where: and(
            eq(schema.assetPriceHistory.assetId, assetId),
            eq(schema.assetPriceHistory.date, date)
        )
    });
    return existing !== undefined;
};

export const deleteAssetPriceHistoryInRange = async (assetId: string, startDate: Date, endDate: Date) => {
    return await db.delete(schema.assetPriceHistory)
        .where(
            and(
                eq(schema.assetPriceHistory.assetId, assetId),
                gte(schema.assetPriceHistory.date, startDate),
                lte(schema.assetPriceHistory.date, endDate)
            )
        );
};

export const updateAssetHistory = async (assetId: string, startDate?: string | Date, endDate?: string | Date) => {
    const asset = await getAssetById(assetId);
    if (!asset || !asset.symbol) {
        throw new Error(`Asset not found or has no symbol: ${assetId}`);
    }

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
        start.setFullYear(start.getFullYear() - 1);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Safety check if start > end ?
    if (start > end) {
        throw new Error("Start date cannot be after end date");
    }

    console.log(`Fetching history for ${asset.symbol} from ${startStr} to ${endStr}`);

    try {
        const data: ChartResultArray = await fetchHistoricalData(asset.symbol, startStr, endStr);
        const quotes: ChartResultArrayQuote[] = data.quotes

        if (quotes.length > 0) {
            const dates = quotes.map(d => new Date(d.date).getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));

            await deleteAssetPriceHistoryInRange(asset.id, minDate, maxDate);

            const historyRecords = quotes.map(item => ({
                assetId: asset.id,
                date: new Date(item.date),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume
            }));

            await bulkAddAssetPriceHistory(historyRecords);
            return { success: true, count: quotes.length, symbol: asset.symbol };
        }
        return { success: true, count: 0, symbol: asset.symbol };

    } catch (e: any) {
        console.error(`Failed to update history for ${asset.symbol}:`, e);
        throw new Error(`Failed to fetch data: ${e.message}`);
    }
};

// --- Portfolios ---
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

// --- Portfolio Currency ---
export const updatePortfolioCurrency = async (portfolioId: string, currencyId: string, amountChange: number) => {
    const existing = await db.query.portfolioCurrency.findFirst({
        where: and(
            eq(schema.portfolioCurrency.portfolioId, portfolioId),
            eq(schema.portfolioCurrency.currencyId, currencyId)
        )
    });

    if (existing) {
        return await db.update(schema.portfolioCurrency)
            .set({ amount: existing.amount + amountChange })
            .where(eq(schema.portfolioCurrency.id, existing.id))
            .returning();
    } else {
        return await db.insert(schema.portfolioCurrency)
            .values({
                portfolioId,
                currencyId,
                amount: amountChange
            })
            .returning();
    }
};

// --- Transactions ---

// Transaction creation is handled in a DB transaction with the origin operations to ensure consistency

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

    const portfolioIds = portfolios.map(p => p.id);

    if (portfolioIds.length === 0) return { transactions: [], totalCount: 0 };

    const whereClause = inArray(schema.transaction.portfolioId, portfolioIds);

    const [total] = await db.select({ count: count() })
        .from(schema.transaction)
        .where(whereClause);

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
    const portfolioIds = portfolios.map(p => p.id);

    if (portfolioIds.length === 0) return { transactions: [], totalCount: 0 };
    const whereClause = and(
        inArray(schema.transaction.portfolioId, portfolioIds),
        eq(schema.transaction.assetId, assetId)
    );
    const [total] = await db.select({ count: count() })
        .from(schema.transaction)
        .where(whereClause);
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

// --- Exchange Pairs & Rates ---
export const getExchangePairs = async () => {
    return await db.query.exchangePair.findMany({
        with: {
            fromCurrency: true,
            toCurrency: true
        }
    });
};

export const createExchangePair = async (data: InferInsertModel<typeof schema.exchangePair>) => {
    return await db.insert(schema.exchangePair).values(data).returning();
};

export const addExchangeRate = async (data: InferInsertModel<typeof schema.exchangeRateHistory>) => {
    return await db.insert(schema.exchangeRateHistory).values(data).returning();
};

export const getExchangeRateHistory = async (pairId: string, limit: number = 30) => {
    return await db.query.exchangeRateHistory.findMany({
        where: eq(schema.exchangeRateHistory.pairId, pairId),
        orderBy: [desc(schema.exchangeRateHistory.date)],
        limit
    });
};

// --- Helper Functions ---

/**
 * Ensures that EUR and USD as well as GCN exist in the currencies table.
 * If they don't exist, they are created.
 */
export const assertBaseCurrencies = async () => {
    // Try to find EUR and USD
    const existingCurrencies = await db.query.currency.findMany({
        where: inArray(schema.currency.id, ['EUR', 'USD', 'GCN'])
    });

    const currenciesMap = new Map(existingCurrencies.map(c => [c.id, c]));

    const results = {
        EUR: currenciesMap.get('EUR'),
        USD: currenciesMap.get('USD'),
        GCN: currenciesMap.get('GCN')
    }

    if (!results.EUR) {
        const [eur] = await createCurrency({
            id: 'EUR',
            name: 'Euro',
            symbol: '€',
            isRealWorld: true
        });
        results.EUR = eur;
    }

    if (!results.USD) {
        const [usd] = await createCurrency({
            id: 'USD',
            name: 'US Dollar',
            symbol: '$',
            isRealWorld: true
        });
        results.USD = usd;
    }

    if (!results.GCN) {
        const [gcn] = await createCurrency({
            id: 'GCN',
            name: 'Gnag Coin',
            symbol: '💸',
            isRealWorld: false
        });
        results.GCN = gcn;
    }

    return results;
};

/**
 * Creates a portfolio for a user if they don't have one,
 * and credits a starting gift of 100,000 EUR.
 */
export const assertUserPortfolio = async (userId: string) => {

    const existingPortfolio = await db.query.portfolio.findFirst({
        where: eq(schema.portfolio.userId, userId)
    });

    if (existingPortfolio) {
        return existingPortfolio;
    }

    // Transaction
    return await db.transaction(async (tx) => {
        // 1. Create Portfolio
        const [newPortfolio] = await tx.insert(schema.portfolio).values({
            userId,
            name: 'Main Portfolio'
        }).returning();

        if (!newPortfolio) throw new Error("Failed to create portfolio");

        // 2. Add 100,000 EUR entry to portfolio_currency
        await tx.insert(schema.portfolioCurrency).values({
            portfolioId: newPortfolio.id,
            currencyId: 'EUR',
            amount: 100000
        });

        // 3. Record the transaction (Gift)
        await tx.insert(schema.transaction).values({
            portfolioId: newPortfolio.id,
            type: 'gift',
            totalValue: 100000,
            fromCurrencyId: 'EUR',
            toCurrencyId: 'EUR',
            executedAt: new Date(),
            notes: 'Starting capital'
        });

        console.log(`Created portfolio for user ${userId} with starting gift of 100,000 EUR.`);

        return newPortfolio;
    });
};

export const assertAssetCategories = async () => {
    const categories = [
        { id: 'equity', name: 'Equity' },
        { id: 'etf', name: 'ETF' },
        { id: 'future', name: 'Future' }
    ];
    for (const category of categories) {
        const existing = await db.query.assetCategory.findFirst({
            where: eq(schema.assetCategory.id, category.id)
        });
        if (!existing) {
            await createAssetCategory(category);
            console.log(`Created asset category: ${category.name}`);
        }
    }
};

export const assertCurrencyConversions = async () => {
    const pairs = [
        { fromCurrencyId: 'EUR', toCurrencyId: 'USD', symbol: 'EURUSD=X' },
        { fromCurrencyId: 'USD', toCurrencyId: 'EUR', symbol: 'USDEUR=X' },
        { fromCurrencyId: 'EUR', toCurrencyId: 'GCN', symbol: 'EURGCN', staticConversionRate: 1 },
        { fromCurrencyId: 'GCN', toCurrencyId: 'EUR', symbol: 'GNCEUR', staticConversionRate: 1 },
    ];
    for (const pair of pairs) {
        const existing = await db.query.exchangePair.findFirst({
            where: and(
                eq(schema.exchangePair.fromCurrencyId, pair.fromCurrencyId),
                eq(schema.exchangePair.toCurrencyId, pair.toCurrencyId)
            )
        });
        if (!existing) {
            await createExchangePair(pair);
            console.log(`Created exchange pair: ${pair.fromCurrencyId} to ${pair.toCurrencyId}`);
        }
    }
};