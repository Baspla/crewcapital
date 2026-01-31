PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_asset_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`average_buy_price` real DEFAULT 0,
	`total_fees` real DEFAULT 0,
	`updated_at` integer,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_asset_inventory`("id", "portfolio_id", "asset_id", "quantity", "average_buy_price", "total_fees", "updated_at") SELECT "id", "portfolio_id", "asset_id", "quantity", "average_buy_price", "total_fees", "updated_at" FROM `asset_inventory`;--> statement-breakpoint
DROP TABLE `asset_inventory`;--> statement-breakpoint
ALTER TABLE `__new_asset_inventory` RENAME TO `asset_inventory`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_portfolio` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_portfolio`("id", "user_id", "name", "created_at", "updated_at") SELECT "id", "user_id", "name", "created_at", "updated_at" FROM `portfolio`;--> statement-breakpoint
DROP TABLE `portfolio`;--> statement-breakpoint
ALTER TABLE `__new_portfolio` RENAME TO `portfolio`;--> statement-breakpoint
CREATE TABLE `__new_portfolio_currency` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`currency_id` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_portfolio_currency`("id", "portfolio_id", "currency_id", "amount", "updated_at") SELECT "id", "portfolio_id", "currency_id", "amount", "updated_at" FROM `portfolio_currency`;--> statement-breakpoint
DROP TABLE `portfolio_currency`;--> statement-breakpoint
ALTER TABLE `__new_portfolio_currency` RENAME TO `portfolio_currency`;--> statement-breakpoint
CREATE TABLE `__new_prediction` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`result` text DEFAULT 'null',
	`text` text,
	`decider_id` text,
	`asset_id` text,
	`target_price` real,
	`direction` text,
	`end_date` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`decider_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_prediction`("id", "type", "status", "result", "text", "decider_id", "asset_id", "target_price", "direction", "end_date", "created_at", "updated_at") SELECT "id", "type", "status", "result", "text", "decider_id", "asset_id", "target_price", "direction", "end_date", "created_at", "updated_at" FROM `prediction`;--> statement-breakpoint
DROP TABLE `prediction`;--> statement-breakpoint
ALTER TABLE `__new_prediction` RENAME TO `prediction`;--> statement-breakpoint
CREATE TABLE `__new_prediction_wager` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`prediction_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency_id` text NOT NULL,
	`choice` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prediction_id`) REFERENCES `prediction`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_prediction_wager`("id", "portfolio_id", "prediction_id", "amount", "currency_id", "choice", "created_at") SELECT "id", "portfolio_id", "prediction_id", "amount", "currency_id", "choice", "created_at" FROM `prediction_wager`;--> statement-breakpoint
DROP TABLE `prediction_wager`;--> statement-breakpoint
ALTER TABLE `__new_prediction_wager` RENAME TO `prediction_wager`;--> statement-breakpoint
CREATE TABLE `__new_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`asset_id` text,
	`type` text NOT NULL,
	`amount` real,
	`price_per_unit` real,
	`total_value` real,
	`fee` real DEFAULT 0,
	`conversion_rate` real,
	`from_currency_id` text NOT NULL,
	`to_currency_id` text NOT NULL,
	`executed_at` integer NOT NULL,
	`prediction_wager_id` text,
	`notes` text,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prediction_wager_id`) REFERENCES `prediction_wager`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_transaction`("id", "portfolio_id", "asset_id", "type", "amount", "price_per_unit", "total_value", "fee", "conversion_rate", "from_currency_id", "to_currency_id", "executed_at", "prediction_wager_id", "notes") SELECT "id", "portfolio_id", "asset_id", "type", "amount", "price_per_unit", "total_value", "fee", "conversion_rate", "from_currency_id", "to_currency_id", "executed_at", "prediction_wager_id", "notes" FROM `transaction`;--> statement-breakpoint
DROP TABLE `transaction`;--> statement-breakpoint
ALTER TABLE `__new_transaction` RENAME TO `transaction`;