import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	mockFindExistingBaseCurrencies,
	mockCreateCurrency,
	mockFindExchangePair,
	mockCreateExchangePair,
	mockCreateAssetCategory,
	mockDb
} = vi.hoisted(() => ({
	mockFindExistingBaseCurrencies: vi.fn(),
	mockCreateCurrency: vi.fn(),
	mockFindExchangePair: vi.fn(),
	mockCreateExchangePair: vi.fn(),
	mockCreateAssetCategory: vi.fn(),
	mockDb: {
		query: {
			assetCategory: {
				findFirst: vi.fn()
			}
		}
	}
}));

vi.mock('$lib/server/data-access/catalog', () => ({
	findExistingBaseCurrencies: mockFindExistingBaseCurrencies,
	createCurrency: mockCreateCurrency,
	findExchangePair: mockFindExchangePair,
	createExchangePair: mockCreateExchangePair,
	createAssetCategory: mockCreateAssetCategory
}));

vi.mock('$lib/server/db', () => ({ db: mockDb }));

import { assertAssetCategories, assertBaseCurrencies, assertCurrencyConversions } from '$lib/server/services/bootstrap';

describe('bootstrap service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('asserts base currencies and creates missing ones', async () => {
		mockFindExistingBaseCurrencies.mockResolvedValue([]);
		mockCreateCurrency
			.mockResolvedValueOnce([{ id: 'EUR' }])
			.mockResolvedValueOnce([{ id: 'USD' }])
			.mockResolvedValueOnce([{ id: 'GCN' }]);

		const result = await assertBaseCurrencies();
		expect(result).toEqual({ EUR: { id: 'EUR' }, USD: { id: 'USD' }, GCN: { id: 'GCN' } });
		expect(mockCreateCurrency).toHaveBeenCalledTimes(3);
	});

	it('returns existing base currencies without creating new ones', async () => {
		mockFindExistingBaseCurrencies.mockResolvedValue([
			{ id: 'EUR' },
			{ id: 'USD' },
			{ id: 'GCN' }
		]);

		const result = await assertBaseCurrencies();

		expect(result).toEqual({ EUR: { id: 'EUR' }, USD: { id: 'USD' }, GCN: { id: 'GCN' } });
		expect(mockCreateCurrency).not.toHaveBeenCalled();
	});

	it('creates missing exchange pairs for base currency conversions', async () => {
		mockFindExchangePair
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null);

		await assertCurrencyConversions();

		expect(mockCreateExchangePair).toHaveBeenCalledTimes(4);
	});

	it('creates only missing asset categories', async () => {
		mockDb.query.assetCategory.findFirst
			.mockResolvedValueOnce({ id: 'equity', name: 'Equity' })
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null);

		await assertAssetCategories();

		expect(mockCreateAssetCategory).toHaveBeenCalledTimes(2);
	});
});
