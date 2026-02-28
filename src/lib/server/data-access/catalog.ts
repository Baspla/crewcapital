import { and, desc, eq, inArray, type InferInsertModel } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

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

export const deleteExchangePair = async (id: string) => {
	return await db.delete(schema.exchangePair).where(eq(schema.exchangePair.id, id));
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

export const findExistingBaseCurrencies = async () => {
	return await db.query.currency.findMany({
		where: inArray(schema.currency.id, ['EUR', 'USD', 'GCN'])
	});
};

export const findExchangePair = async (fromCurrencyId: string, toCurrencyId: string) => {
	return await db.query.exchangePair.findFirst({
		where: and(
			eq(schema.exchangePair.fromCurrencyId, fromCurrencyId),
			eq(schema.exchangePair.toCurrencyId, toCurrencyId)
		)
	});
};
