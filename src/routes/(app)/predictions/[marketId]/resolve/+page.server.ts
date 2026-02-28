import {
	getPredictionMarketData,
	resolvePredictionMarket
} from '$lib/server/services/predictions';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	if (!locals.user) throw redirect(302, '/login');

	const marketData = await getPredictionMarketData([params.marketId]);
	if (!marketData || marketData.length === 0) throw error(404, 'Market not found');
	const market = marketData[0].market;

	if (market.deciderId !== (await parent()).user.id) {
		throw error(403, 'You are not the authorized resolver for this market.');
	}

    if (market.status === 'resolved') {
        // Maybe allow viewing resolution?
    }

	return { market };
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) throw error(401, 'Unauthorized');

		const marketData = await getPredictionMarketData([params.marketId]);
		if (!marketData.length) throw error(404, 'Market not found');
		const market = marketData[0].market;

		if (market.deciderId !== locals.user.id) {
			throw error(403, 'Unauthorized');
		}

		const formData = await request.formData();
		const result = formData.get('result') as 'yes' | 'no' | 'null';

		if (!['yes', 'no', 'null'].includes(result)) {
			return fail(400, { error: 'Invalid result provided.' });
		}

		try {
			await resolvePredictionMarket(params.marketId, result);
			throw redirect(303, `/predictions/${params.marketId}`);
		} catch (e: any) {
             if ((e as any).status === 303) throw e;
			console.error(e);
			return fail(500, { error: e.message || 'Failed to resolve market' });
		}
	}
};
