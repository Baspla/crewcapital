CREATE TABLE `prediction_market_history` (
	`id` text PRIMARY KEY NOT NULL,
	`prediction_market_id` text NOT NULL,
	`date` integer NOT NULL,
	`yes_pool` real NOT NULL,
	`no_pool` real NOT NULL,
	FOREIGN KEY (`prediction_market_id`) REFERENCES `prediction_market`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_asset_price_history` (
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
INSERT INTO `__new_asset_price_history`("id", "asset_id", "date", "open", "high", "low", "close", "volume") SELECT "id", "asset_id", "date", "open", "high", "low", "close", "volume" FROM `asset_price_history`;--> statement-breakpoint
DROP TABLE `asset_price_history`;--> statement-breakpoint
ALTER TABLE `__new_asset_price_history` RENAME TO `asset_price_history`;--> statement-breakpoint
PRAGMA foreign_keys=ON;