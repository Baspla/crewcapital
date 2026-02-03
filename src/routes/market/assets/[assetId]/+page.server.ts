import { getAssetById, getAssetPriceHistory, getUserAssetTransactions } from "$lib/server/db/actions";
import { requireAuth } from "$lib/server/guards";
import type { PageServerLoad } from "../../$types";

export const load: PageServerLoad = async (event) => {
    const user = requireAuth(event);
    // @ts-ignore - The slug parameter is correctly typed in SvelteKit, but is not recognized by TypeScript here.
    const assetId: string = event.params.assetId;
    const asset = await getAssetById(assetId);
    const page = Number(event.url.searchParams.get('page')) || 1;
    const pageSize = Number(event.url.searchParams.get('pageSize')) || 10;

    // Validate
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));

    const { transactions, totalCount } = await getUserAssetTransactions(user.id, assetId, safePage, safePageSize);
    const assetPriceHistory = await getAssetPriceHistory(assetId);

    return {
        asset,
        transactions,
        totalCount,
        page: safePage,
        pageSize: safePageSize,
        assetPriceHistory
    };
}
