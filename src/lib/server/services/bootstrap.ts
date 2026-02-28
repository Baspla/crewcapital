import { eq } from 'drizzle-orm';
import {
	createAssetCategory,
	createCurrency,
	createExchangePair,
	findExchangePair,
	findExistingBaseCurrencies
} from '$lib/server/data-access/catalog';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';

export const assertBaseCurrencies = async () => {
	const existingCurrencies = await findExistingBaseCurrencies();
	const currenciesMap = new Map(existingCurrencies.map((currency) => [currency.id, currency]));

	const results = {
		EUR: currenciesMap.get('EUR'),
		USD: currenciesMap.get('USD'),
		GCN: currenciesMap.get('GCN')
	};

	if (!results.EUR) {
		const [eur] = await createCurrency({
			id: 'EUR',
			name: 'Euro',
			symbol: '€',
			isRealWorld: true
		});
		results.EUR = eur;
	}

	if (!results.USD) {
		const [usd] = await createCurrency({
			id: 'USD',
			name: 'US Dollar',
			symbol: '$',
			isRealWorld: true
		});
		results.USD = usd;
	}

	if (!results.GCN) {
		const [gcn] = await createCurrency({
			id: 'GCN',
			name: 'Gnag Coin',
			symbol: '💸',
			isRealWorld: false
		});
		results.GCN = gcn;
	}

	return results;
};

export const assertAssetCategories = async () => {
	const categories = [
		{ id: 'equity', name: 'Equity' },
		{ id: 'etf', name: 'ETF' },
		{ id: 'future', name: 'Future' }
	];

	for (const category of categories) {
		const existing = await db.query.assetCategory.findFirst({
			where: eq(schema.assetCategory.id, category.id)
		});
		if (!existing) {
			await createAssetCategory(category);
			console.log(`Created asset category: ${category.name}`);
		}
	}
};

export const assertCurrencyConversions = async () => {
	const pairs = [
		{ fromCurrencyId: 'EUR', toCurrencyId: 'USD', symbol: 'EURUSD=X' },
		{ fromCurrencyId: 'USD', toCurrencyId: 'EUR', symbol: 'USDEUR=X' },
		{ fromCurrencyId: 'EUR', toCurrencyId: 'GCN', symbol: 'EURGCN', staticConversionRate: 1 },
		{ fromCurrencyId: 'GCN', toCurrencyId: 'EUR', symbol: 'GNCEUR', staticConversionRate: 1 }
	];
	for (const pair of pairs) {
		const existing = await findExchangePair(pair.fromCurrencyId, pair.toCurrencyId);
		if (!existing) {
			await createExchangePair(pair);
			console.log(`Created exchange pair: ${pair.fromCurrencyId} to ${pair.toCurrencyId}`);
		}
	}
};
