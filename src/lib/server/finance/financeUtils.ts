import { addAssetPriceHistory, existsAssetPriceHistory, getAssets } from "../db/actions";
import { fetchRealTimeData } from "./yahooapi";

export const updateMarketData = async () => {
    const assets = await getAssets();
    console.log(`Updating market data for ${assets.length} assets...`);
    assets.forEach(async (asset) => {
        if (asset.symbol) {
            fetchRealTimeData(asset.symbol).then(async (quote) => {
                if (quote && quote.regularMarketPrice) {
                    const quoteDate = quote.regularMarketTime ? new Date(quote.regularMarketTime) : new Date();

                    const existing = existsAssetPriceHistory(asset.id, quoteDate);

                    if (!existing) {
                        addAssetPriceHistory({
                            assetId: asset.id,
                            date: quoteDate,
                            open: quote.regularMarketOpen ?? undefined,
                            high: quote.regularMarketDayHigh ?? undefined,
                            low: quote.regularMarketDayLow ?? undefined,
                            close: quote.regularMarketPrice,
                            volume: quote.regularMarketVolume ?? undefined
                        });
                        console.log(`Updated market price for asset ${asset.symbol} to ${quote.regularMarketPrice} at ${quoteDate.toISOString()} (${quote.regularMarketTime})`);
                    } else {
                        console.log(`Market data for asset ${asset.symbol} at ${quoteDate.toISOString()} already exists. Skipping.`);
                    }
                }
            }).catch((err) => {
                console.error(`Error fetching market data for asset ${asset.symbol}:`, err);
            });
        }
    });
}