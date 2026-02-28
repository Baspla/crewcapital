import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
	mockDb: {
		query: {
			exchangePair: { findFirst: vi.fn() },
			exchangeRateHistory: { findFirst: vi.fn() }
		},
		transaction: vi.fn()
	}
}));

vi.mock('$lib/server/db', () => ({ db: mockDb }));
vi.mock('@sveltejs/kit', () => ({
	error: (status: number, message: string) => {
		const err = new Error(message) as Error & { status?: number };
		err.status = status;
		throw err;
	}
}));

import { executeExchange, getExchangeRate } from './exchange';

describe('exchange service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns static conversion rate when available', async () => {
		mockDb.query.exchangePair.findFirst.mockResolvedValue({
			id: 'pair-1',
			staticConversionRate: 1.25
		});

		const result = await getExchangeRate('pair-1');
		expect(result).toBe(1.25);
		expect(mockDb.query.exchangeRateHistory.findFirst).not.toHaveBeenCalled();
	});

	it('uses latest historical rate if static rate is missing', async () => {
		mockDb.query.exchangePair.findFirst.mockResolvedValue({
			id: 'pair-2',
			staticConversionRate: null
		});
		mockDb.query.exchangeRateHistory.findFirst.mockResolvedValue({ rate: 0.92 });

		const result = await getExchangeRate('pair-2');
		expect(result).toBe(0.92);
	});

	it('throws when pair does not exist', async () => {
		mockDb.query.exchangePair.findFirst.mockResolvedValue(null);
		await expect(getExchangeRate('missing')).rejects.toMatchObject({ status: 404 });
	});

	it('executes exchange and creates destination balance when missing', async () => {
		const tx = {
			query: {
				portfolio: { findFirst: vi.fn().mockResolvedValue({ id: 'p1', userId: 'u1' }) },
				exchangePair: {
					findFirst: vi.fn().mockResolvedValue({
						id: 'pair-1',
						fromCurrencyId: 'EUR',
						toCurrencyId: 'USD',
						staticConversionRate: 2
					})
				},
				exchangeRateHistory: { findFirst: vi.fn() },
				portfolioCurrency: {
					findFirst: vi
						.fn()
						.mockResolvedValueOnce({ portfolioId: 'p1', currencyId: 'EUR', amount: 100 })
						.mockResolvedValueOnce(null)
				}
			},
			update: vi.fn(() => ({
				set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }))
			})),
			insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }))
		};

		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		const result = await executeExchange('u1', 'p1', 'pair-1', 10);
		expect(result).toEqual({ success: true, fromAmount: 10, toAmount: 20, rate: 2 });
		expect(tx.update).toHaveBeenCalledTimes(1);
		expect(tx.insert).toHaveBeenCalledTimes(2);
	});
});
