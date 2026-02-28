import { getPredictionMarkets } from '$lib/server/services/predictions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = (await event.parent()).user;
	const {markets,totalCount} = await getPredictionMarkets();
	const page = Number(event.url.searchParams.get('page')) || 1;
	const pageSize = Number(event.url.searchParams.get('pageSize')) || 10;
	return {
		user,
		markets,
		totalCount,
		page,
		pageSize
	};
};
