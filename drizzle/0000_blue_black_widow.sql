CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `asset` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`category_id` text NOT NULL,
	`currency_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `asset_category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asset_symbol_unique` ON `asset` (`symbol`);--> statement-breakpoint
CREATE TABLE `asset_category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `asset_inventory` (
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
CREATE TABLE `asset_price_history` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`date` integer NOT NULL,
	`open` real,
	`high` real,
	`low` real,
	`close` real,
	`volume` integer,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `currency` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`symbol` text NOT NULL,
	`is_real_world` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `currency_symbol_unique` ON `currency` (`symbol`);--> statement-breakpoint
CREATE TABLE `exchange_pair` (
	`id` text PRIMARY KEY NOT NULL,
	`from_currency_id` text NOT NULL,
	`to_currency_id` text NOT NULL,
	`symbol` text NOT NULL,
	`static_conversion_rate` real,
	`name` text,
	FOREIGN KEY (`from_currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exchange_pair_symbol_unique` ON `exchange_pair` (`symbol`);--> statement-breakpoint
CREATE TABLE `exchange_rate_history` (
	`id` text PRIMARY KEY NOT NULL,
	`pair_id` text NOT NULL,
	`rate` real NOT NULL,
	`date` integer NOT NULL,
	FOREIGN KEY (`pair_id`) REFERENCES `exchange_pair`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `portfolio` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `portfolio_currency` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`currency_id` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prediction_market` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`result` text DEFAULT 'null',
	`title` text NOT NULL,
	`yes_pool` real NOT NULL,
	`no_pool` real NOT NULL,
	`currency_id` text NOT NULL,
	`text` text,
	`decider_id` text,
	`asset_id` text,
	`target_price` real,
	`direction` text,
	`end_date` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decider_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "yesPoolPositive" CHECK("prediction_market"."yes_pool" > 0),
	CONSTRAINT "noPoolPositive" CHECK("prediction_market"."no_pool" > 0)
);
--> statement-breakpoint
CREATE TABLE `prediction_market_history` (
	`id` text PRIMARY KEY NOT NULL,
	`prediction_market_id` text NOT NULL,
	`date` integer NOT NULL,
	`yes_pool` real NOT NULL,
	`no_pool` real NOT NULL,
	`probability` real NOT NULL,
	FOREIGN KEY (`prediction_market_id`) REFERENCES `prediction_market`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prediction_market_share` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`prediction_market_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency_id` text NOT NULL,
	`choice` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prediction_market_id`) REFERENCES `prediction_market`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "amountPositive" CHECK("prediction_market_share"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`asset_id` text,
	`type` text NOT NULL,
	`amount_of_units` real,
	`price_per_unit` real,
	`total_value` real,
	`fee` real DEFAULT 0,
	`conversion_rate` real,
	`from_currency_id` text NOT NULL,
	`to_currency_id` text NOT NULL,
	`executed_at` integer NOT NULL,
	`prediction_market_share_id` text,
	`notes` text,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolio`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_currency_id`) REFERENCES `currency`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prediction_market_share_id`) REFERENCES `prediction_market_share`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`groups` text DEFAULT '[]'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);