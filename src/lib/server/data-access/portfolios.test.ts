import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
	mockDb: {
		query: {
			portfolioCurrency: { findFirst: vi.fn() },
			portfolio: { findMany: vi.fn() },
			transaction: { findMany: vi.fn() }
		},
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn()
	}
}));

vi.mock('$lib/server/db', () => ({ db: mockDb }));

import { getUserTransactions, updatePortfolioCurrency } from '$lib/server/data-access/portfolios';

describe('portfolios data access', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('updates existing portfolio currency amount', async () => {
		mockDb.query.portfolioCurrency.findFirst.mockResolvedValue({ id: 'pc1', amount: 10 });
		const returning = vi.fn().mockResolvedValue([{ id: 'pc1', amount: 15 }]);
		const where = vi.fn(() => ({ returning }));
		const set = vi.fn(() => ({ where }));
		mockDb.update.mockReturnValue({ set });

		const result = await updatePortfolioCurrency('portfolio-1', 'EUR', 5);
		expect(result).toEqual([{ id: 'pc1', amount: 15 }]);
		expect(mockDb.update).toHaveBeenCalledTimes(1);
		expect(mockDb.insert).not.toHaveBeenCalled();
	});

	it('creates portfolio currency if no existing row exists', async () => {
		mockDb.query.portfolioCurrency.findFirst.mockResolvedValue(null);
		const returning = vi.fn().mockResolvedValue([{ portfolioId: 'portfolio-1', currencyId: 'EUR', amount: 5 }]);
		const values = vi.fn(() => ({ returning }));
		mockDb.insert.mockReturnValue({ values });

		const result = await updatePortfolioCurrency('portfolio-1', 'EUR', 5);
		expect(result).toEqual([{ portfolioId: 'portfolio-1', currencyId: 'EUR', amount: 5 }]);
		expect(mockDb.insert).toHaveBeenCalledTimes(1);
		expect(mockDb.update).not.toHaveBeenCalled();
	});

	it('returns empty user transactions when user has no portfolios', async () => {
		mockDb.query.portfolio.findMany.mockResolvedValue([]);

		const result = await getUserTransactions('user-1');
		expect(result).toEqual({ transactions: [], totalCount: 0 });
		expect(mockDb.select).not.toHaveBeenCalled();
	});

	it('returns paginated user transactions with total count', async () => {
		mockDb.query.portfolio.findMany.mockResolvedValue([{ id: 'portfolio-1' }]);
		const where = vi.fn().mockResolvedValue([{ count: 2 }]);
		const from = vi.fn(() => ({ where }));
		mockDb.select.mockReturnValue({ from });
		mockDb.query.transaction.findMany.mockResolvedValue([
			{ id: 't1', portfolioId: 'portfolio-1' },
			{ id: 't2', portfolioId: 'portfolio-1' }
		]);

		const result = await getUserTransactions('user-1', 1, 10);

		expect(result).toEqual({
			transactions: [
				{ id: 't1', portfolioId: 'portfolio-1' },
				{ id: 't2', portfolioId: 'portfolio-1' }
			],
			totalCount: 2
		});
		expect(mockDb.select).toHaveBeenCalledTimes(1);
		expect(mockDb.query.transaction.findMany).toHaveBeenCalledTimes(1);
	});
});
