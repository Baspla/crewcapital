import { pgTable, text, integer, doublePrecision, boolean, timestamp, check, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const user = pgTable('user', {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  groups: text("groups").default("[]"),
});

export const session = pgTable(
  "session",
  {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at", { mode: "date" })
	  .defaultNow()
	  .notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" })
	  .$onUpdate(() => new Date())
	  .notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
	  .notNull()
	  .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
	  .notNull()
	  .references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", {
	  mode: "date",
	}),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
	  mode: "date",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at", { mode: "date" })
	  .defaultNow()
	  .notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" })
	  .$onUpdate(() => new Date())
	  .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
	createdAt: timestamp("created_at", { mode: "date" })
	  .defaultNow()
	  .notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" })
	  .defaultNow()
	  .$onUpdate(() => new Date())
	  .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);


export const userRelations = relations(user, ({ many }) => ({
	portfolios: many(portfolio),
	decidedPredictionMarkets: many(predictionMarket),
	sessions: many(session),
	  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
	fields: [session.userId],
	references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
	fields: [account.userId],
	references: [user.id],
  }),
}));


export const assetCategory = pgTable('asset_category', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description')
});

export const assetCategoryRelations = relations(assetCategory, ({ many }) => ({
	assets: many(asset)
}));

export const currency = pgTable('currency', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	symbol: text('symbol').notNull().unique(),
	isRealWorld: boolean('is_real_world').notNull().default(true)
});

export const currencyRelations = relations(currency, ({ many }) => ({
	assets: many(asset),
	portfolios: many(portfolioCurrency),
	fromTransactions: many(transaction, { relationName: 'fromCurrency' }),
	toTransactions: many(transaction, { relationName: 'toCurrency' }),
	exchangePairsFrom: many(exchangePair, { relationName: 'fromCurrency' }),
	exchangePairsTo: many(exchangePair, { relationName: 'toCurrency' })
}));

export const asset = pgTable('asset', {
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
	createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()),
	updatedAt: timestamp('updated_at', { mode: 'date' })
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

export const assetPriceHistory = pgTable('asset_price_history', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	assetId: text('asset_id')
		.notNull()
		.references(() => asset.id),
	date: timestamp('date', { mode: 'date' }).notNull(),
	open: doublePrecision('open'),
	high: doublePrecision('high'),
	low: doublePrecision('low'),
	close: doublePrecision('close'),
	volume: integer('volume')
});

export const assetPriceHistoryRelations = relations(assetPriceHistory, ({ one }) => ({
	asset: one(asset, {
		fields: [assetPriceHistory.assetId],
		references: [asset.id]
	})
}));

export const portfolio = pgTable('portfolio', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()),
	updatedAt: timestamp('updated_at', { mode: 'date' })
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

export const portfolioCurrency = pgTable('portfolio_currency', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	portfolioId: text('portfolio_id')
		.notNull()
		.references(() => portfolio.id, { onDelete: 'cascade' }),
	currencyId: text('currency_id')
		.notNull()
		.references(() => currency.id),
	amount: doublePrecision('amount').notNull().default(0),
	updatedAt: timestamp('updated_at', { mode: 'date' })
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

export const assetInventory = pgTable('asset_inventory', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	portfolioId: text('portfolio_id')
		.notNull()
		.references(() => portfolio.id, { onDelete: 'cascade' }),
	assetId: text('asset_id')
		.notNull()
		.references(() => asset.id),
	quantity: doublePrecision('quantity').notNull().default(0),
	averageBuyPrice: doublePrecision('average_buy_price').default(0),
	totalFees: doublePrecision('total_fees').default(0),
	updatedAt: timestamp('updated_at', { mode: 'date' })
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

export const transaction = pgTable('transaction', {
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
	amountOfUnits: doublePrecision('amount_of_units'), // Quantity of asset
	pricePerUnit: doublePrecision('price_per_unit'),
	totalValue: doublePrecision('total_value'), // value in toCurrency
	fee: doublePrecision('fee').default(0),
	conversionRate: doublePrecision('conversion_rate'),
	fromCurrencyId: text('from_currency_id')
		.notNull()
		.references(() => currency.id),
	toCurrencyId: text('to_currency_id')
		.notNull()
		.references(() => currency.id),
	executedAt: timestamp('executed_at', { mode: 'date' })
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

export const exchangePair = pgTable('exchange_pair', {
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
	staticConversionRate: doublePrecision('static_conversion_rate'),
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

export const exchangeRateHistory = pgTable('exchange_rate_history', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	pairId: text('pair_id').notNull().references(() => exchangePair.id),
	rate: doublePrecision('rate').notNull(),
	date: timestamp('date', { mode: 'date' }).notNull()
});

export const exchangeRateHistoryRelations = relations(exchangeRateHistory, ({ one }) => ({
	pair: one(exchangePair, {
		fields: [exchangeRateHistory.pairId],
		references: [exchangePair.id]
	})
}));

export const predictionMarket = pgTable('prediction_market', {
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

	yesPool: doublePrecision('yes_pool').notNull(),
	noPool: doublePrecision('no_pool').notNull(),

	// This is the currency in which shares are bought/sold NOT of the tracked asset (if any)
	currencyId: text('currency_id')
		.notNull()
		.references(() => currency.id),

	// Text Prediction fields
	text: text('text'),
	deciderId: text('decider_id').references(() => user.id, { onDelete: 'set null' }),

	// Asset Prediction fields
	assetId: text('asset_id').references(() => asset.id),
	targetPrice: doublePrecision('target_price'),
	direction: text('direction', { enum: ['above', 'below'] }),

	endDate: timestamp('end_date', { mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { mode: 'date' })
		.$defaultFn(() => new Date()),
	updatedAt: timestamp('updated_at', { mode: 'date' })
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

export const predictionMarketHistory = pgTable('prediction_market_history', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	predictionMarketId: text('prediction_market_id')
		.notNull()
		.references(() => predictionMarket.id),
	date: timestamp('date', { mode: 'date' }).notNull(),
	yesPool: doublePrecision('yes_pool').notNull(),
	noPool: doublePrecision('no_pool').notNull(),
	probability: doublePrecision('probability').notNull() // Probability of "yes" outcome at this point in time, for easy querying without calculating on the fly
});

export const predictionMarketHistoryRelations = relations(predictionMarketHistory, ({ one }) => ({
	predictionMarket: one(predictionMarket, {
		fields: [predictionMarketHistory.predictionMarketId],
		references: [predictionMarket.id]
	})
}));

export const predictionMarketShare = pgTable('prediction_market_share', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	portfolioId: text('portfolio_id')
		.notNull()
		.references(() => portfolio.id, { onDelete: 'cascade' }),
	predictionMarketId: text('prediction_market_id')
		.notNull()
		.references(() => predictionMarket.id),
	amount: doublePrecision('amount').notNull(),
	currencyId: text('currency_id') // Wager currency
		.notNull()
		.references(() => currency.id),
	choice: text('choice', { enum: ['yes', 'no'] }).notNull(),
	createdAt: timestamp('created_at', { mode: 'date' })
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
