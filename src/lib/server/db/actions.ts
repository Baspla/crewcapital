import { eq, and, desc, asc, inArray, count, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { db } from './index';
import * as schema from './schema';

// --- Users ---
export const getUsers = async () => {
    return await db.query.user.findMany();
};

export const getUserById = async (id: string) => {
    return await db.query.user.findFirst({ where: eq(schema.user.id, id) });
};

export const upsertUser = async (data: InferInsertModel<typeof schema.user>) => {
    // We cannot change email here if it is unique?
    // externalId is unique. email is unique.
    // Ideally we target externalId.
    return await db.insert(schema.user)
        .values(data)
        .onConflictDoUpdate({
            target: schema.user.externalId,
            set: {
                email: data.email,
                username: data.username,
                displayName: data.displayName,
                avatarUrl: data.avatarUrl,
                groups: data.groups,
                active: data.active,
                updatedAt: new Date()
            }
        })
        .returning();
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

export const getAssetById = async (id: string) => {
    return await db.query.asset.findFirst({
        where: eq(schema.asset.id, id),
        with: {
            category: true,
            currency: true,
            priceHistory: {
                orderBy: [desc(schema.assetPriceHistory.date)],
                limit: 1
            }
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

export const getAssetPriceHistory = async (assetId: string, limit: number = 30) => {
    return await db.query.assetPriceHistory.findMany({
        where: eq(schema.assetPriceHistory.assetId, assetId),
        orderBy: [desc(schema.assetPriceHistory.date)],
        limit
    });
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
            portfolio: true,
            asset: true,
            fromCurrency: true,
            toCurrency: true,
            predictionWager: true
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
 * Ensures that EUR and USD currencies exist in the database.
 * If they don't exist, they are created.
 */
export const ensureBaseCurrencies = async () => {
    // Try to find EUR and USD
    const existingCurrencies = await db.query.currency.findMany({
        where: inArray(schema.currency.id, ['EUR', 'USD'])
    });

    const currenciesMap = new Map(existingCurrencies.map(c => [c.id, c]));

    const results = {
        EUR: currenciesMap.get('EUR'),
        USD: currenciesMap.get('USD')
    }

    if (!results.EUR) {
        const [eur] = await createCurrency({
            id: 'EUR',
            name: 'Euro',
            symbol: '€'
        });
        results.EUR = eur;
    }

    if (!results.USD) {
        const [usd] = await createCurrency({
            id: 'USD',
            name: 'US Dollar',
            symbol: '$'
        });
        results.USD = usd;
    }

    return results;
};

/**
 * Creates a portfolio for a user if they don't have one,
 * and credits a starting gift of 100,000 EUR.
 */
export const ensureUserPortfolio = async (userId: string) => {
    // Ensure currencies exist before transaction
    await ensureBaseCurrencies();

    const existingPortfolio = await db.query.portfolio.findFirst({
        where: eq(schema.portfolio.userId, userId)
    });

    if (existingPortfolio) {
        return existingPortfolio;
    }

    // Transaction for better-sqlite3 must be synchronous
    return db.transaction((tx) => {
        // 1. Create Portfolio
        const newPortfolio = tx.insert(schema.portfolio).values({
            userId,
            name: 'Main Portfolio'
        }).returning().get(); // .get() returns the first row

        if (!newPortfolio) throw new Error("Failed to create portfolio");

        // 2. Add 100,000 EUR entry to portfolio_currency
        tx.insert(schema.portfolioCurrency).values({
            portfolioId: newPortfolio.id,
            currencyId: 'EUR',
            amount: 100000
        }).run();

        // 3. Record the transaction (Gift)
        tx.insert(schema.transaction).values({
            portfolioId: newPortfolio.id,
            type: 'gift',
            totalValue: 100000,
            fromCurrencyId: 'EUR',
            toCurrencyId: 'EUR',
            executedAt: new Date(),
            notes: 'Starting capital'
        }).run();

        console.log(`Created portfolio for user ${userId} with starting gift of 100,000 EUR.`);

        return newPortfolio;
    });
};

