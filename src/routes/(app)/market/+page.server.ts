import { getAssetsPaginated } from '$lib/server/data-access/assets';
import { getAssetPriceHistory } from '$lib/server/services/asset-history';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const page = Number(event.url.searchParams.get('page')) || 1;
	const pageSize = Number(event.url.searchParams.get('pageSize')) || 10;
    
    // Validate
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));

    const { assets, totalCount } = await getAssetsPaginated(safePage, safePageSize);
    const pairs = await Promise.all(assets.map(async (asset) => ({
        asset,
        priceHistory: await getAssetPriceHistory(asset.id)
    })));
    
    return { 
        assetPriceHistoryPairs: pairs,
        totalCount,
        page: safePage,
        pageSize: safePageSize
    };
}
