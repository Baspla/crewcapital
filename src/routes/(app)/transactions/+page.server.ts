import { getUserTransactions } from '$lib/server/data-access/portfolios';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Stellt sicher, dass der User authentifiziert ist
	// Wirft einen Redirect, wenn keine Auth-Header vorhanden sind
	const user = event.locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const page = Number(event.url.searchParams.get('page')) || 1;
	const pageSize = Number(event.url.searchParams.get('pageSize')) || 10;
	
	try{
	const { transactions, totalCount } = await getUserTransactions(user.id, page, pageSize);

	return {
		user,
		transactions,
		totalCount,
		page,
		pageSize
	};
	
	} catch (err) {
		console.error('Error fetching transactions:', err);
		throw err;
	}
};
