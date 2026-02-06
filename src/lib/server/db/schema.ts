import { check, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const user = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	externalId: text('external_id').unique(),
	email: text('email').unique().notNull(),
	username: text('username').unique(),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	givenName: text('given_name'),
	familyName: text('family_name'),
	active: integer('active', { mode: 'boolean' }).default(true),
	groups: text('groups', { mode: 'json' }).$type<string[]>().default([]),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});

export const userRelations = relations(user, ({ many }) => ({
	portfolios: many(portfolio),
	decidedPredictionMarkets: many(predictionMarket)
}));

export const assetCategory = sqliteTable('asset_category', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description')
});

export const assetCategoryRelations = relations(assetCategory, ({ many }) => ({
	assets: many(asset)
}));

export const currency = sqliteTable('currency', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	symbol: text('symbol').notNull().unique(),
	isRealWorld: integer('is_real_world', { mode: 'boolean' }).notNull().default(true)
});

export const currencyRelations = relations(currency, ({ many }) => ({
	assets: many(asset),
	portfolios: many(portfolioCurrency),
	fromTransactions: many(transaction, { relationName: 'fromCurrency' }),
	toTransactions: many(transaction, { relationName: 'toCurrency' }),
	exchangePairsFrom: many(exchangePair, { relationName: 'fromCurrency' }),
	exchangePairsTo: many(exchangePair, { relationName: 'toCurrency' })
}));

export const asset = sqliteTable('asset', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	symbol: text('symbol').notNull().unique(),
	name: text('name').notNull(),
	categoryId: text('category_id')
		.notNull()
		.references(() => assetCategory.id),
	currencyId: text('currency_id')
		.notNull()
		.references(() => currency.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});

export const assetRelations = relations(asset, ({ one, many }) => ({
	category: one(assetCategory, {
		fields: [asset.categoryId],
		references: [assetCategory.id]
	}),
	currency: one(currency, {
		fields: [asset.currencyId],
		references: [currency.id]
	}),
	priceHistory: many(assetPriceHistory),
	inventories: many(assetInventory),
	transactions: many(transaction)
}));

export const assetPriceHistory = sqliteTable('asset_price_history', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	assetId: text('asset_id')
		.notNull()
		.references(() => asset.id),
	date: integer('date', { mode: 'timestamp' }).notNull(),
	open: real('open'),
	high: real('high'),
	low: real('low'),
	close: real('close'),
	volume: integer('volume')
});

export const assetPriceHistoryRelations = relations(assetPriceHistory, ({ one }) => ({
	asset: one(asset, {
		fields: [assetPriceHistory.assetId],
		references: [asset.id]
	})
}));

export const portfolio = sqliteTable('portfolio', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});

export const portfolioRelations = relations(portfolio, ({ one, many }) => ({
	user: one(user, {
		fields: [portfolio.userId],
		references: [user.id]
	}),
	currencies: many(portfolioCurrency),
	inventory: many(assetInventory),
	transactions: many(transaction),
	predictionMarketShares: many(predictionMarketShare)
}));

export const portfolioCurrency = sqliteTable('portfolio_currency', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	portfolioId: text('portfolio_id')
		.notNull()
		.references(() => portfolio.id, { onDelete: 'cascade' }),
	currencyId: text('currency_id')
		.notNull()
		.references(() => currency.id),
	amount: real('amount').notNull().default(0),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});

export const portfolioCurrencyRelations = relations(portfolioCurrency, ({ one }) => ({
	portfolio: one(portfolio, {
		fields: [portfolioCurrency.portfolioId],
		references: [portfolio.id]
	}),
	currency: one(currency, {
		fields: [portfolioCurrency.currencyId],
		references: [currency.id]
	})
}));

export const assetInventory = sqliteTable('asset_inventory', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	portfolioId: text('portfolio_id')
		.notNull()
		.references(() => portfolio.id, { onDelete: 'cascade' }),
	assetId: text('asset_id')
		.notNull()
		.references(() => asset.id),
	quantity: real('quantity').notNull().default(0),
	averageBuyPrice: real('average_buy_price').default(0),
	totalFees: real('total_fees').default(0),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});

export const assetInventoryRelations = relations(assetInventory, ({ one }) => ({
	portfolio: one(portfolio, {
		fields: [assetInventory.portfolioId],
		references: [portfolio.id]
	}),
	asset: one(asset, {
		fields: [assetInventory.assetId],
		references: [asset.id]
	})
}));

export const transaction = sqliteTable('transaction', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	portfolioId: text('portfolio_id')
		.notNull()
		.references(() => portfolio.id, { onDelete: 'cascade' }),
	assetId: text('asset_id').references(() => asset.id), // Nullable for non-asset transactions
	type: text('type', {
		enum: ['buy', 'sell', 'deposit', 'withdrawal','sent','received', 'gift', 'fee', 'currency_conversion', 'prediction_cost', 'prediction_win', 'prediction_draw', 'prediction_reimbursement', 'prediction_sale']
	}).notNull(),
	amountOfUnits: real('amount_of_units'), // Quantity of asset
	pricePerUnit: real('price_per_unit'),
	totalValue: real('total_value'), // value in toCurrency
	fee: real('fee').default(0),
	conversionRate: real('conversion_rate'),
	fromCurrencyId: text('from_currency_id')
		.notNull()
		.references(() => currency.id),
	toCurrencyId: text('to_currency_id')
		.notNull()
		.references(() => currency.id),
	executedAt: integer('executed_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	predictionMarketShareId: text('prediction_market_share_id').references(() => predictionMarketShare.id, { onDelete: 'set null' }),
	notes: text('notes')
});

export const transactionRelations = relations(transaction, ({ one }) => ({
	portfolio: one(portfolio, {
		fields: [transaction.portfolioId],
		references: [portfolio.id]
	}),
	asset: one(asset, {
		fields: [transaction.assetId],
		references: [asset.id]
	}),
	fromCurrency: one(currency, {
		fields: [transaction.fromCurrencyId],
		references: [currency.id],
		relationName: 'fromCurrency'
	}),
	toCurrency: one(currency, {
		fields: [transaction.toCurrencyId],
		references: [currency.id],
		relationName: 'toCurrency'
	}),
	predictionMarketShare: one(predictionMarketShare, {
		fields: [transaction.predictionMarketShareId],
		references: [predictionMarketShare.id]
	})
}));

export const exchangePair = sqliteTable('exchange_pair', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	fromCurrencyId: text('from_currency_id')
		.notNull()
		.references(() => currency.id),
	toCurrencyId: text('to_currency_id')
		.notNull()
		.references(() => currency.id),
	symbol: text('symbol').unique().notNull(), // e.g. "EUR/USD" or "EURUSD"
	staticConversionRate: real('static_conversion_rate'),
	name: text('name')
});

export const exchangePairRelations = relations(exchangePair, ({ one, many }) => ({
	fromCurrency: one(currency, {
		fields: [exchangePair.fromCurrencyId],
		references: [currency.id],
		relationName: 'fromCurrency'
	}),
	toCurrency: one(currency, {
		fields: [exchangePair.toCurrencyId],
		references: [currency.id],
		relationName: 'toCurrency'
	}),
	rates: many(exchangeRateHistory)
}));

export const exchangeRateHistory = sqliteTable('exchange_rate_history', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	pairId: text('pair_id').notNull().references(() => exchangePair.id),
	rate: real('rate').notNull(),
	date: integer('date', { mode: 'timestamp' }).notNull()
});

export const exchangeRateHistoryRelations = relations(exchangeRateHistory, ({ one }) => ({
	pair: one(exchangePair, {
		fields: [exchangeRateHistory.pairId],
		references: [exchangePair.id]
	})
}));

export const predictionMarket = sqliteTable('prediction_market', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	type: text('type', { enum: ['binary_text', 'price_target'] }).notNull(),
	status: text('status', {
		enum: ['pending', 'resolved', 'cancelled']
	}).notNull().default('pending'),
	result: text('result', {
		enum: ['yes', 'no', 'null'] // null is for unresolved/push
	}).default('null'),
	title: text('title').notNull(),

	yesPool: real('yes_pool').notNull(),
	noPool: real('no_pool').notNull(),

	// This is the currency in which shares are bought/sold NOT of the tracked asset (if any)
	currencyId: text('currency_id')
		.notNull()
		.references(() => currency.id),

	// Text Prediction fields
	text: text('text'),
	deciderId: text('decider_id').references(() => user.id, { onDelete: 'set null' }),

	// Asset Prediction fields
	assetId: text('asset_id').references(() => asset.id),
	targetPrice: real('target_price'),
	direction: text('direction', { enum: ['above', 'below'] }),

	endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
}, (table) => [
	check('yesPoolPositive', sql`${table.yesPool} > 0`),
	check('noPoolPositive', sql`${table.noPool} > 0`),
]
);

export const predictionMarketRelations = relations(predictionMarket, ({ one, many }) => ({
	decider: one(user, {
		fields: [predictionMarket.deciderId],
		references: [user.id]
	}),
	asset: one(asset, {
		fields: [predictionMarket.assetId],
		references: [asset.id]
	}),
	shares: many(predictionMarketShare),
	transactions: many(transaction),
	history: many(predictionMarketHistory)
}));

export const predictionMarketHistory = sqliteTable('prediction_market_history', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	predictionMarketId: text('prediction_market_id')
		.notNull()
		.references(() => predictionMarket.id),
	date: integer('date', { mode: 'timestamp' }).notNull(),
	yesPool: real('yes_pool').notNull(),
	noPool: real('no_pool').notNull(),
	probability: real('probability').notNull() // Probability of "yes" outcome at this point in time, for easy querying without calculating on the fly
});

export const predictionMarketHistoryRelations = relations(predictionMarketHistory, ({ one }) => ({
	predictionMarket: one(predictionMarket, {
		fields: [predictionMarketHistory.predictionMarketId],
		references: [predictionMarket.id]
	})
}));

export const predictionMarketShare = sqliteTable('prediction_market_share', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	portfolioId: text('portfolio_id')
		.notNull()
		.references(() => portfolio.id, { onDelete: 'cascade' }),
	predictionMarketId: text('prediction_market_id')
		.notNull()
		.references(() => predictionMarket.id),
	amount: real('amount').notNull(),
	currencyId: text('currency_id') // Wager currency
		.notNull()
		.references(() => currency.id),
	choice: text('choice', { enum: ['yes', 'no'] }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
}, (table) => [
	check('amountPositive', sql`${table.amount} > 0`),
]);

export const predictionMarketShareRelations = relations(predictionMarketShare, ({ one }) => ({
	portfolio: one(portfolio, {
		fields: [predictionMarketShare.portfolioId],
		references: [portfolio.id]
	}),
	predictionMarket: one(predictionMarket, {
		fields: [predictionMarketShare.predictionMarketId],
		references: [predictionMarket.id]
	}),
	currency: one(currency, {
		fields: [predictionMarketShare.currencyId],
		references: [currency.id]
	})
}));
