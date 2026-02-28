import { and, desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { auth } from '$lib/auth';
import { getAssetById } from '$lib/server/data-access/assets';
import { getUserAssetTransactions } from '$lib/server/data-access/portfolios';
import { getAssetPriceHistory } from '$lib/server/services/asset-history';
import type { Actions, PageServerLoad } from './$types';

const getPortfolioForUser = async (userId: string, selectedPortfolioId?: string | null) => {
    if (selectedPortfolioId) {
        const selectedPortfolio = await db.query.portfolio.findFirst({
            where: and(eq(schema.portfolio.userId, userId), eq(schema.portfolio.id, selectedPortfolioId)),
            columns: { id: true }
        });

        if (selectedPortfolio) {
            return selectedPortfolio;
        }
    }

    return await db.query.portfolio.findFirst({
        where: eq(schema.portfolio.userId, userId),
        columns: { id: true }
    });
};

const isWholeUnitQuantity = (quantity: number) => Number.isFinite(quantity) && Number.isInteger(quantity) && quantity > 0;

export const load: PageServerLoad = async (event) => {
    const { user, selectedPortfolio } = await event.parent();
    const assetId = event.params.assetId;
    const asset = await getAssetById(assetId);
    const page = Number(event.url.searchParams.get('page')) || 1;
    const pageSize = Number(event.url.searchParams.get('pageSize')) || 10;

    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));

    const { transactions, totalCount } = await getUserAssetTransactions(user.id, assetId, safePage, safePageSize);
    const assetPriceHistory = await getAssetPriceHistory(assetId);

    if (!asset || !selectedPortfolio) {
        return {
            asset,
            transactions,
            totalCount,
            page: safePage,
            pageSize: safePageSize,
            assetPriceHistory,
            currentPrice: null,
            availableBalance: 0,
            ownedQuantity: 0
        };
    }

    const [latestPrice, portfolioCurrency, inventoryPosition] = await Promise.all([
        db.query.assetPriceHistory.findFirst({
            where: eq(schema.assetPriceHistory.assetId, assetId),
            orderBy: [desc(schema.assetPriceHistory.date)],
            columns: { close: true }
        }),
        db.query.portfolioCurrency.findFirst({
            where: and(
                eq(schema.portfolioCurrency.portfolioId, selectedPortfolio.id),
                eq(schema.portfolioCurrency.currencyId, asset.currencyId)
            ),
            columns: { amount: true }
        }),
        db.query.assetInventory.findFirst({
            where: and(
                eq(schema.assetInventory.portfolioId, selectedPortfolio.id),
                eq(schema.assetInventory.assetId, assetId)
            ),
            columns: { quantity: true }
        })
    ]);

    return {
        asset,
        transactions,
        totalCount,
        page: safePage,
        pageSize: safePageSize,
        assetPriceHistory,
        currentPrice: latestPrice?.close ?? null,
        availableBalance: portfolioCurrency?.amount ?? 0,
        ownedQuantity: inventoryPosition?.quantity ?? 0
    };
};

export const actions: Actions = {
    buy: async (event) => {
        const session = await auth.api.getSession({ headers: event.request.headers });
        const user = session?.user;
        if (!user) {
            return fail(401, { error: 'Unauthorized' });
        }
        const assetId = event.params.assetId;
        const quantity = Number.parseFloat((await event.request.formData()).get('quantity') as string);

        if (!isWholeUnitQuantity(quantity)) {
            return fail(400, { error: 'Please provide a whole-number quantity.' });
        }

        const asset = await getAssetById(assetId);
        if (!asset) {
            return fail(404, { error: 'Asset not found.' });
        }

        const portfolio = await getPortfolioForUser(user.id, event.cookies.get('selected_portfolio_id'));
        if (!portfolio) {
            return fail(400, { error: 'No portfolio found.' });
        }

        const [latestPrice, portfolioCurrency, inventoryPosition] = await Promise.all([
            db.query.assetPriceHistory.findFirst({
                where: eq(schema.assetPriceHistory.assetId, assetId),
                orderBy: [desc(schema.assetPriceHistory.date)],
                columns: { close: true }
            }),
            db.query.portfolioCurrency.findFirst({
                where: and(
                    eq(schema.portfolioCurrency.portfolioId, portfolio.id),
                    eq(schema.portfolioCurrency.currencyId, asset.currencyId)
                )
            }),
            db.query.assetInventory.findFirst({
                where: and(
                    eq(schema.assetInventory.portfolioId, portfolio.id),
                    eq(schema.assetInventory.assetId, assetId)
                )
            })
        ]);

        const currentPrice = latestPrice?.close;
        if (!currentPrice || currentPrice <= 0) {
            return fail(400, { error: 'No valid market price available for this asset.' });
        }

        if (!portfolioCurrency) {
            return fail(400, { error: 'Portfolio does not support the required currency.' });
        }

        const totalValue = quantity * currentPrice;
        if (portfolioCurrency.amount < totalValue) {
            return fail(400, { error: 'Insufficient balance for this purchase.' });
        }

        await db.transaction(async (tx) => {
            await tx
                .update(schema.portfolioCurrency)
                .set({ amount: portfolioCurrency.amount - totalValue })
                .where(eq(schema.portfolioCurrency.id, portfolioCurrency.id));

            if (inventoryPosition) {
                const newQuantity = inventoryPosition.quantity + quantity;
                const existingCostBasis = (inventoryPosition.averageBuyPrice ?? 0) * inventoryPosition.quantity;
                const newAverageBuyPrice = newQuantity > 0 ? (existingCostBasis + totalValue) / newQuantity : currentPrice;

                await tx
                    .update(schema.assetInventory)
                    .set({
                        quantity: newQuantity,
                        averageBuyPrice: newAverageBuyPrice
                    })
                    .where(eq(schema.assetInventory.id, inventoryPosition.id));
            } else {
                await tx.insert(schema.assetInventory).values({
                    portfolioId: portfolio.id,
                    assetId,
                    quantity,
                    averageBuyPrice: currentPrice,
                    totalFees: 0
                });
            }

            await tx.insert(schema.transaction).values({
                portfolioId: portfolio.id,
                assetId,
                type: 'buy',
                amountOfUnits: quantity,
                pricePerUnit: currentPrice,
                totalValue,
                fee: 0,
                fromCurrencyId: asset.currencyId,
                toCurrencyId: asset.currencyId,
                executedAt: new Date(),
                notes: `Bought ${quantity} ${asset.symbol}`
            });
        });

        return { successMessage: `Successfully bought ${quantity} ${asset.symbol}.` };
    },
    sell: async (event) => {
        const session = await auth.api.getSession({ headers: event.request.headers });
        const user = session?.user;
        if (!user) {
            return fail(401, { error: 'Unauthorized' });
        }
        const assetId = event.params.assetId;
        const quantity = Number.parseFloat((await event.request.formData()).get('quantity') as string);

        if (!isWholeUnitQuantity(quantity)) {
            return fail(400, { error: 'Please provide a whole-number quantity.' });
        }

        const asset = await getAssetById(assetId);
        if (!asset) {
            return fail(404, { error: 'Asset not found.' });
        }

        const portfolio = await getPortfolioForUser(user.id, event.cookies.get('selected_portfolio_id'));
        if (!portfolio) {
            return fail(400, { error: 'No portfolio found.' });
        }

        const [latestPrice, portfolioCurrency, inventoryPosition] = await Promise.all([
            db.query.assetPriceHistory.findFirst({
                where: eq(schema.assetPriceHistory.assetId, assetId),
                orderBy: [desc(schema.assetPriceHistory.date)],
                columns: { close: true }
            }),
            db.query.portfolioCurrency.findFirst({
                where: and(
                    eq(schema.portfolioCurrency.portfolioId, portfolio.id),
                    eq(schema.portfolioCurrency.currencyId, asset.currencyId)
                )
            }),
            db.query.assetInventory.findFirst({
                where: and(
                    eq(schema.assetInventory.portfolioId, portfolio.id),
                    eq(schema.assetInventory.assetId, assetId)
                )
            })
        ]);

        const currentPrice = latestPrice?.close;
        if (!currentPrice || currentPrice <= 0) {
            return fail(400, { error: 'No valid market price available for this asset.' });
        }

        if (!inventoryPosition || inventoryPosition.quantity < quantity) {
            return fail(400, { error: 'Insufficient asset quantity to sell.' });
        }

        if (!portfolioCurrency) {
            return fail(400, { error: 'Portfolio does not support the required currency.' });
        }

        const totalValue = quantity * currentPrice;
        const remainingQuantity = inventoryPosition.quantity - quantity;

        await db.transaction(async (tx) => {
            await tx
                .update(schema.portfolioCurrency)
                .set({ amount: portfolioCurrency.amount + totalValue })
                .where(eq(schema.portfolioCurrency.id, portfolioCurrency.id));

            await tx
                .update(schema.assetInventory)
                .set({
                    quantity: remainingQuantity,
                    averageBuyPrice: remainingQuantity > 0 ? inventoryPosition.averageBuyPrice : 0
                })
                .where(eq(schema.assetInventory.id, inventoryPosition.id));

            await tx.insert(schema.transaction).values({
                portfolioId: portfolio.id,
                assetId,
                type: 'sell',
                amountOfUnits: quantity,
                pricePerUnit: currentPrice,
                totalValue,
                fee: 0,
                fromCurrencyId: asset.currencyId,
                toCurrencyId: asset.currencyId,
                executedAt: new Date(),
                notes: `Sold ${quantity} ${asset.symbol}`
            });
        });

        return { successMessage: `Successfully sold ${quantity} ${asset.symbol}.` };
    }
};
