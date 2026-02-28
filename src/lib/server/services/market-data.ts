import {
	addAssetPriceHistory,
	existsAssetPriceHistory,
	getAssets
} from '$lib/server/data-access/assets';
import { fetchRealTimeData } from '$lib/server/finance/yahooapi';

export const updateMarketData = async () => {
	console.log('Market data update disabled.');
	return;

	const assets = await getAssets();
	console.log(`Updating market data for ${assets.length} assets...`);
	for (const asset of assets) {
		if (!asset.symbol) {
			continue;
		}

		try {
			const quote = await fetchRealTimeData(asset.symbol);
			if (!quote || !quote.regularMarketPrice) {
				continue;
			}

			const quoteDate = quote.regularMarketTime ? new Date(quote.regularMarketTime) : new Date();
			const existing = await existsAssetPriceHistory(asset.id, quoteDate);

			if (existing) {
				console.log(`Market data for asset ${asset.symbol} at ${quoteDate.toISOString()} already exists. Skipping.`);
				continue;
			}

			await addAssetPriceHistory({
				assetId: asset.id,
				date: quoteDate,
				open: quote.regularMarketOpen ?? undefined,
				high: quote.regularMarketDayHigh ?? undefined,
				low: quote.regularMarketDayLow ?? undefined,
				close: quote.regularMarketPrice,
				volume: quote.regularMarketVolume ?? undefined
			});
			console.log(
				`Updated market price for asset ${asset.symbol} to ${quote.regularMarketPrice} at ${quoteDate.toISOString()} (${quote.regularMarketTime})`
			);
		} catch (err) {
			console.error(`Error fetching market data for asset ${asset.symbol}:`, err);
		}
	}
};