import { fail } from '@sveltejs/kit';
import { createCurrency, getCurrencies, deleteCurrency } from '$lib/server/data-access/catalog';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	await parent(); // Ensure auth check runs
	const currencies = await getCurrencies();
	return { currencies };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString().toUpperCase().trim();
		const name = formData.get('name')?.toString().trim();
		const symbol = formData.get('symbol')?.toString().trim();
		const isRealWorld = formData.get('isRealWorld') === 'on';

		if (!id || !name || !symbol) {
			return fail(400, { missing: true, error: 'All fields are required' });
		}

		try {
			await createCurrency({ id, name, symbol, isRealWorld });
			return { success: true };
		} catch (error) {
			console.error('Error adding currency:', error);
			return fail(500, { error: 'Failed to add currency' });
		}
	},
	delete: async ({ request }) => {
			const formData = await request.formData();
			const id = formData.get('id')?.toString();

			if (!id) {
				return fail(400, { error: 'ID is required' });
			}

			try {
				await deleteCurrency(id);
				return { success: true };
			} catch (error) {
				console.error('Error deleting currency:', error);
				return fail(500, { error: 'Failed to delete currency' });
			}
		}
};
