import { fetchHistoricalData } from '$lib/server/finance/yahooapi';
import { largestTriangleThreeBuckets } from '$lib/server/finance/algorithms';
import {
	bulkAddAssetPriceHistory,
	deleteAssetPriceHistoryInRange,
	getAssetById,
	getAssetPriceHistoryRaw
} from '$lib/server/data-access/assets';
import type { ChartResultArray, ChartResultArrayQuote } from 'yahoo-finance2/modules/chart';

export const getAssetPriceHistory = async (assetId: string, startDate?: Date, endDate?: Date, limit: number = 300) => {
	const data = await getAssetPriceHistoryRaw(assetId, startDate, endDate);

	if (data.length <= limit) {
		return data;
	}

	return largestTriangleThreeBuckets(data, limit);
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

	if (start > end) {
		throw new Error('Start date cannot be after end date');
	}

	console.log(`Fetching history for ${asset.symbol} from ${startStr} to ${endStr}`);

	try {
		const data: ChartResultArray = await fetchHistoricalData(asset.symbol, startStr, endStr);
		const quotes: ChartResultArrayQuote[] = data.quotes;

		if (quotes.length > 0) {
			const dates = quotes.map((quote) => new Date(quote.date).getTime());
			const minDate = new Date(Math.min(...dates));
			const maxDate = new Date(Math.max(...dates));

			await deleteAssetPriceHistoryInRange(asset.id, minDate, maxDate);

			const historyRecords = quotes.map((item) => ({
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
	} catch (error: any) {
		console.error(`Failed to update history for ${asset.symbol}:`, error);
		throw new Error(`Failed to fetch data: ${error.message}`);
	}
};
