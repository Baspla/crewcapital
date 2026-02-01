import { fail } from '@sveltejs/kit';
import { createAsset, getCurrencies, getAssetCategories, getAssetsPaginated, updateAssetHistory } from '$lib/server/db/actions';
import { fetchHistoricalData, fetchStockQuote } from '$lib/server/yahoo/finance';
import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
    refreshHistory: async ({ request }) => {
        const formData = await request.formData();
        const assetId = formData.get('assetId');

        if (!assetId || typeof assetId !== 'string') {
            return fail(400, { missing: true });
        }
        
        try {
            await updateAssetHistory(assetId);
            return { success: true, historyUpdated: true };
        } catch (error) {
            console.error(error);
            return fail(500, { assetId, error: 'Failed to update history' });
        }
    },
    addAsset: async ({ request }) => {

        const formData = await request.formData();
        const symbol = formData.get('ticker');

        if (!symbol || typeof symbol !== 'string') {
            return fail(400, { missing: true });
        }

        try {
            const quote = await fetchStockQuote(symbol);

            if (!quote) {
                return fail(404, { symbol, notFound: true });
            }

            const quoteCurrency = quote.currency;
            if (!quoteCurrency) {
                return fail(400, { symbol, error: 'Could not determine currency from quote' });
            }

            const currencies = await getCurrencies();
            // Assume currency ID is the currency code (e.g. USD)
            const currencyExists = currencies.some((c) => c.id === quoteCurrency);

            if (!currencyExists) {
                return fail(400, { symbol, error: `Currency ${quoteCurrency} not found in DB` });
            }

            const categories = await getAssetCategories();
            let categoryId: string;
            if (quote.quoteType === 'EQUITY') {
                categoryId = 'equity'; 
            } else if (quote.quoteType === 'ETF') {
                categoryId = 'etf';
            } else if (quote.quoteType === 'FUTURE') {
                categoryId = 'future';
            } else {
                return fail(400, { symbol, error: `Unsupported quote type: ${quote.quoteType}` });
            }

            const categoryExists = categories.some((c) => c.id === categoryId);
            if (!categoryExists) {
                return fail(500, { error: `Category '${categoryId}' not found in DB` });
            }

            await createAsset({
                symbol: quote.symbol,
                name: quote.longName || quote.shortName || quote.symbol,
                categoryId: categoryId,
                currencyId: quoteCurrency,
            });

            return { success: true, symbol: quote.symbol };
        } catch (error) {
            console.error(error);
            return fail(500, { symbol, error: 'Failed to fetch or save asset' });
        }
    }
};

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page')) || 1;
	const pageSize = Number(event.url.searchParams.get('pageSize')) || 10;
    
    // Validate
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));

    const { assets, totalCount } = await getAssetsPaginated(safePage, safePageSize);
    
    return { 
        assets,
        totalCount,
        page: safePage,
        pageSize: safePageSize
    };
}
