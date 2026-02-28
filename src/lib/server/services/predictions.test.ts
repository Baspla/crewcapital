import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb, mockUtils } = vi.hoisted(() => ({
	mockDb: {
		transaction: vi.fn()
	},
	mockUtils: {
		getProbabilityForMarket: vi.fn(() => 0.5),
		calculateBoughtSharesForAmount: vi.fn(),
		calculateSaleAmountForShares: vi.fn()
	}
}));

vi.mock('$lib/server/db', () => ({ db: mockDb }));
vi.mock('$lib/predictions/utils', () => mockUtils);

import { buyPredictionMarketShares, resolvePredictionMarket } from '$lib/server/services/predictions';

describe('prediction markets service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-fixed' as ReturnType<typeof crypto.randomUUID>);
	});

	it('throws if market is missing when buying shares', async () => {
		const tx = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) }))
				}))
			}))
		};
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		await expect(buyPredictionMarketShares('m1', 'p1', 10, 'yes')).rejects.toThrow('Market not found');
	});

	it('throws if portfolio balance is insufficient when buying', async () => {
		const tx = {
			select: vi
				.fn()
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn().mockResolvedValue([{ id: 'm1', status: 'pending', currencyId: 'EUR', yesPool: 100, noPool: 100, title: 'Market' }])
						}))
					}))
				})
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 'p1' }]) }))
					}))
				})
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ amount: 5 }]) }))
					}))
				})
		};
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		await expect(buyPredictionMarketShares('m1', 'p1', 10, 'yes')).rejects.toThrow('Insufficient balance');
	});

	it('throws if market is not pending when buying shares', async () => {
		const tx = {
			select: vi.fn().mockReturnValueOnce({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi
							.fn()
							.mockResolvedValue([{ id: 'm1', status: 'resolved', currencyId: 'EUR', yesPool: 100, noPool: 100, title: 'Market' }])
					}))
				}))
			})
		};
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		await expect(buyPredictionMarketShares('m1', 'p1', 10, 'yes')).rejects.toThrow('Market is not open for trading');
	});

	it('throws if portfolio is missing when buying shares', async () => {
		const tx = {
			select: vi
				.fn()
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn().mockResolvedValue([{ id: 'm1', status: 'pending', currencyId: 'EUR', yesPool: 100, noPool: 100, title: 'Market' }])
						}))
					}))
				})
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) }))
					}))
				})
		};
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		await expect(buyPredictionMarketShares('m1', 'p1', 10, 'yes')).rejects.toThrow('Portfolio not found');
	});

	it('buys shares and writes market, portfolio, transaction and history updates', async () => {
		mockUtils.calculateBoughtSharesForAmount.mockReturnValue({ userShares: 5, yesPoolAfter: 110, noPoolAfter: 100 });

		const tx = {
			select: vi
				.fn()
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({
							limit: vi.fn().mockResolvedValue([{ id: 'm1', status: 'pending', currencyId: 'EUR', yesPool: 100, noPool: 100, title: 'Market' }])
						}))
					}))
				})
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 'p1' }]) }))
					}))
				})
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ amount: 100 }]) }))
					}))
				}),
			update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
			insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }))
		};
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		const result = await buyPredictionMarketShares('m1', 'p1', 10, 'yes');
		expect(result).toEqual({ shareId: 'uuid-fixed', userShares: 5 });
		expect(tx.update).toHaveBeenCalledTimes(2);
		expect(tx.insert).toHaveBeenCalledTimes(3);
	});

	it('resolves market with null result and refunds shares', async () => {
		const tx = {
			select: vi
				.fn()
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 'm1', status: 'pending', yesPool: 100, noPool: 100, currencyId: 'EUR' }]) }))
					}))
				})
				.mockReturnValueOnce({
					from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ portfolioId: 'p1', amount: 4 }]) }))
				})
				.mockReturnValueOnce({
					from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ amount: 10 }]) }))
				}),
			update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })) })),
			insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) }))
		};
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		await resolvePredictionMarket('m1', 'null');
		expect(tx.update).toHaveBeenCalledTimes(2);
		expect(tx.insert).toHaveBeenCalled();
	});

	it('throws if market is missing when resolving', async () => {
		const tx = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) }))
				}))
			}))
		};
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		await expect(resolvePredictionMarket('m1', 'yes')).rejects.toThrow('Market not found');
	});

	it('throws if market is not pending when resolving', async () => {
		const tx = {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => ({
						limit: vi.fn().mockResolvedValue([{ id: 'm1', status: 'resolved', yesPool: 100, noPool: 100, currencyId: 'EUR' }])
					}))
				}))
			}))
		};
		mockDb.transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

		await expect(resolvePredictionMarket('m1', 'yes')).rejects.toThrow('Market is not open for resolution');
	});
});
