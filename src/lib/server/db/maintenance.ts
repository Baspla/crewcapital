import { db } from './index';
import { lt, eq, and, inArray } from 'drizzle-orm';
import { assetPriceHistory, exchangeRateHistory } from './schema';

/**
 * Consolidates historical asset price data into daily candles.
 * Deletes high-frequency data older than the retention period and replaces it with daily aggregates.
 * 
 * @param olderThanDays - The age in days after which data should be consolidated (e.g., 7 or 30).
 */
export const consolidateAssetHistory = async (olderThanDays: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get all assets
    const assets = await db.query.asset.findMany();

    let totalConsolidated = 0;

    for (const asset of assets) {
        // 1. Fetch raw data older than cutoff
        const history = await db.query.assetPriceHistory.findMany({
            where: and(
                eq(assetPriceHistory.assetId, asset.id),
                lt(assetPriceHistory.date, cutoffDate)
            )
        });

        if (history.length === 0) continue;

        // 2. Group by Day (UTC)
        const groups = new Map<string, typeof history>();
        
        for (const record of history) {
            const dayKey = record.date.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!groups.has(dayKey)) {
                groups.set(dayKey, []);
            }
            groups.get(dayKey)!.push(record);
        }

        // 3. Process groups
        for (const [day, records] of groups) {
            if (records.length <= 1) continue; // Already consolidated or single point

            // Sort by date to determine Open/Close correctly
            records.sort((a, b) => a.date.getTime() - b.date.getTime());

            const first = records[0];
            const last = records[records.length - 1];

            const open = first.open ?? first.close; // Fallback if open missing
            const close = last.close;
            // Calculate High/Low/Volume
            const high = Math.max(...records.map(r => r.high ?? r.close));
            const low = Math.min(...records.map(r => r.low ?? r.close));
            const volume = records.reduce((sum, r) => sum + (r.volume ?? 0), 0);
            
            // Use the start of the day as the timestamp for the consolidated record
            const consolidatedDate = new Date(`${day}T00:00:00.000Z`);

            // 4. Transaction: Delete old records and insert new one
            await db.transaction(async (tx) => {
                const idsToDelete = records.map(r => r.id);
                // Chunk deletions if too many (SQLite limit), though unlikely for one day of minute data (1440 rows)
                await tx.delete(assetPriceHistory)
                    .where(inArray(assetPriceHistory.id, idsToDelete));
                
                await tx.insert(assetPriceHistory).values({
                    assetId: asset.id,
                    date: consolidatedDate,
                    open,
                    high,
                    low,
                    close,
                    volume
                });
            });

            totalConsolidated += records.length;
        }
    }

    return { totalConsolidated };
};

/**
 * Consolidates historical exchange rate data into daily averages.
 * 
 * @param olderThanDays - The age in days after which data should be consolidated.
 */
export const consolidateExchangeRateHistory = async (olderThanDays: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const pairs = await db.query.exchangePair.findMany();
    let totalConsolidated = 0;

    for (const pair of pairs) {
        const history = await db.query.exchangeRateHistory.findMany({
            where: and(
                eq(exchangeRateHistory.pairId, pair.id),
                lt(exchangeRateHistory.date, cutoffDate)
            )
        });

        if (history.length === 0) continue;

        const groups = new Map<string, typeof history>();

        for (const record of history) {
            const dayKey = record.date.toISOString().split('T')[0];
            if (!groups.has(dayKey)) groups.set(dayKey, []);
            groups.get(dayKey)!.push(record);
        }

        for (const [day, records] of groups) {
            if (records.length <= 1) continue;

            // Sort for stability if we used Close, but for Rate we'll use Average here
            // Or maybe Close is better for currency? 
            // Usually for FX, "Closing Rate" is the standard reference.
            // Let's use the LAST rate of the day as the daily rate.
            records.sort((a, b) => a.date.getTime() - b.date.getTime());
            
            const lastRecord = records[records.length - 1];
            const date = new Date(`${day}T00:00:00.000Z`);

            await db.transaction(async (tx) => {
                const idsToDelete = records.map(r => r.id);
                await tx.delete(exchangeRateHistory)
                    .where(inArray(exchangeRateHistory.id, idsToDelete));
                
                await tx.insert(exchangeRateHistory).values({
                    pairId: pair.id,
                    date: date,
                    rate: lastRecord.rate
                });
            });

            totalConsolidated += records.length;
        }
    }

    return { totalConsolidated };
};
