import { fail } from '@sveltejs/kit';
import { createExchangePair, getExchangePairs, deleteExchangePair, getCurrencies } from '$lib/server/data-access/catalog';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	await parent();
	const [exchangeRates, currencies] = await Promise.all([
		getExchangePairs(),
		getCurrencies()
	]);
	return { exchangeRates, currencies };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const fromCurrencyId = formData.get('fromCurrencyId')?.toString();
		const toCurrencyId = formData.get('toCurrencyId')?.toString();
		const symbol = formData.get('symbol')?.toString().trim();
		const staticConversionRateStr = formData.get('staticConversionRate')?.toString();
		
		if (!fromCurrencyId || !toCurrencyId || !symbol) {
			return fail(400, { missing: true, error: 'From, To currency and Symbol are required' });
		}

		if (fromCurrencyId === toCurrencyId) {
			return fail(400, { error: 'From and To currencies must be different' });
		}

		const staticConversionRate = staticConversionRateStr ? parseFloat(staticConversionRateStr) : undefined;
		if (staticConversionRateStr && isNaN(staticConversionRate!)) {
			return fail(400, { error: 'Invalid conversion rate' });
		}

		try {
			await createExchangePair({ 
				fromCurrencyId, 
				toCurrencyId, 
				symbol,
				staticConversionRate
			});
			return { success: true };
		} catch (error) {
			console.error('Error adding exchange rate:', error);
			// Check for unique constraint violation on symbol
			if ((error as any).code === '23505') {
				return fail(400, { error: 'Exchange rate symbol already exists' });
			}
			return fail(500, { error: 'Failed to add exchange rate' });
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		try {
			await deleteExchangePair(id);
			return { success: true };
		} catch (error) {
			console.error('Error deleting exchange rate:', error);
			return fail(500, { error: 'Failed to delete exchange rate' });
		}
	}
};
