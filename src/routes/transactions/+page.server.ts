import { requireAuth } from '$lib/server/guards';
import { getUserTransactions } from '$lib/server/db/actions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	// Stellt sicher, dass der User authentifiziert ist
	// Wirft einen Redirect, wenn keine Auth-Header vorhanden sind
	const user = requireAuth(event);

	const page = Number(event.url.searchParams.get('page')) || 1;
	const pageSize = Number(event.url.searchParams.get('pageSize')) || 10;
	
	const { transactions, totalCount } = await getUserTransactions(user.id, page, pageSize);

	return {
		user: {
			id: user.id,
			email: user.email,
			username: user.username,
			displayName: user.displayName,
			groups: user.groups,
			avatarUrl: user.avatarUrl,
		},
		transactions,
		totalCount,
		page,
		pageSize
	};
};
