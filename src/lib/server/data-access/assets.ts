import { and, asc, count, desc, eq, gte, lte, type InferInsertModel } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

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
			offset,
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

export const addAssetPriceHistory = async (data: InferInsertModel<typeof schema.assetPriceHistory>) => {
	return await db.insert(schema.assetPriceHistory).values(data).returning();
};

export const bulkAddAssetPriceHistory = async (data: InferInsertModel<typeof schema.assetPriceHistory>[]) => {
	if (data.length === 0) return [];
	return await db.insert(schema.assetPriceHistory).values(data).returning();
};

export const getAssetPriceHistoryRaw = async (assetId: string, startDate?: Date, endDate?: Date) => {
	const conditions = [eq(schema.assetPriceHistory.assetId, assetId)];

	if (startDate) {
		conditions.push(gte(schema.assetPriceHistory.date, startDate));
	}

	if (endDate) {
		conditions.push(lte(schema.assetPriceHistory.date, endDate));
	}

	return await db.query.assetPriceHistory.findMany({
		where: and(...conditions),
		orderBy: [asc(schema.assetPriceHistory.date)]
	});
};

export const existsAssetPriceHistory = async (assetId: string, date: Date) => {
	const existing = await db.query.assetPriceHistory.findFirst({
		where: and(eq(schema.assetPriceHistory.assetId, assetId), eq(schema.assetPriceHistory.date, date))
	});
	return existing !== undefined;
};

export const deleteAssetPriceHistoryInRange = async (assetId: string, startDate: Date, endDate: Date) => {
	return await db
		.delete(schema.assetPriceHistory)
		.where(
			and(
				eq(schema.assetPriceHistory.assetId, assetId),
				gte(schema.assetPriceHistory.date, startDate),
				lte(schema.assetPriceHistory.date, endDate)
			)
		);
};
