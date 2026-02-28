import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb, mockGetCurrencies } = vi.hoisted(() => ({
	mockDb: {
		transaction: vi.fn()
	},
	mockGetCurrencies: vi.fn()
}));

vi.mock('$lib/server/db', () => ({ db: mockDb }));
vi.mock('$lib/server/data-access/catalog', () => ({ getCurrencies: mockGetCurrencies }));

import { createUserPortfolio } from '$lib/server/services/portfolio';

describe('portfolio service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates user portfolio and initial gift transaction', async () => {
		mockGetCurrencies.mockResolvedValue([{ id: 'EUR' }, { id: 'USD' }, { id: 'GCN' }]);

		const txInsert = vi
			.fn()
			.mockReturnValueOnce({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([{ id: 'portfolio-1', userId: 'user-1', name: 'Main Portfolio' }])
				}))
			})
			.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

		const tx = { insert: txInsert };
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		const portfolio = await createUserPortfolio('user-1');
		expect(portfolio).toEqual({ id: 'portfolio-1', userId: 'user-1', name: 'Main Portfolio' });
		expect(txInsert).toHaveBeenCalledTimes(5);
	});

	it('throws when EUR currency is not available', async () => {
		mockGetCurrencies.mockResolvedValue([{ id: 'USD' }, { id: 'GCN' }]);

		const txInsert = vi.fn().mockReturnValueOnce({
			values: vi.fn(() => ({
				returning: vi.fn().mockResolvedValue([{ id: 'portfolio-1', userId: 'user-1', name: 'Main Portfolio' }])
			}))
		});

		const tx = { insert: txInsert };
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		await expect(createUserPortfolio('user-1')).rejects.toThrow('EUR currency not found');
	});
});
