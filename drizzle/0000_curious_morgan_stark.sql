CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"category_id" text NOT NULL,
	"currency_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "asset_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "asset_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "asset_inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"quantity" double precision DEFAULT 0 NOT NULL,
	"average_buy_price" double precision DEFAULT 0,
	"total_fees" double precision DEFAULT 0,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "asset_price_history" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"open" double precision,
	"high" double precision,
	"low" double precision,
	"close" double precision,
	"volume" integer
);
--> statement-breakpoint
CREATE TABLE "currency" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"is_real_world" boolean DEFAULT true NOT NULL,
	CONSTRAINT "currency_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "exchange_pair" (
	"id" text PRIMARY KEY NOT NULL,
	"from_currency_id" text NOT NULL,
	"to_currency_id" text NOT NULL,
	"symbol" text NOT NULL,
	"static_conversion_rate" double precision,
	"name" text,
	CONSTRAINT "exchange_pair_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "exchange_rate_history" (
	"id" text PRIMARY KEY NOT NULL,
	"pair_id" text NOT NULL,
	"rate" double precision NOT NULL,
	"date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "portfolio_currency" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"currency_id" text NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "prediction_market" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" text DEFAULT 'null',
	"title" text NOT NULL,
	"yes_pool" double precision NOT NULL,
	"no_pool" double precision NOT NULL,
	"currency_id" text NOT NULL,
	"text" text,
	"decider_id" text,
	"asset_id" text,
	"target_price" double precision,
	"direction" text,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "yesPoolPositive" CHECK ("prediction_market"."yes_pool" > 0),
	CONSTRAINT "noPoolPositive" CHECK ("prediction_market"."no_pool" > 0)
);
--> statement-breakpoint
CREATE TABLE "prediction_market_history" (
	"id" text PRIMARY KEY NOT NULL,
	"prediction_market_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"yes_pool" double precision NOT NULL,
	"no_pool" double precision NOT NULL,
	"probability" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_market_share" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"prediction_market_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"currency_id" text NOT NULL,
	"choice" text NOT NULL,
	"created_at" timestamp,
	CONSTRAINT "amountPositive" CHECK ("prediction_market_share"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"asset_id" text,
	"type" text NOT NULL,
	"amount_of_units" double precision,
	"price_per_unit" double precision,
	"total_value" double precision,
	"fee" double precision DEFAULT 0,
	"conversion_rate" double precision,
	"from_currency_id" text NOT NULL,
	"to_currency_id" text NOT NULL,
	"executed_at" timestamp NOT NULL,
	"prediction_market_share_id" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"groups" text DEFAULT '[]',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_category_id_asset_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_inventory" ADD CONSTRAINT "asset_inventory_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_inventory" ADD CONSTRAINT "asset_inventory_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_price_history" ADD CONSTRAINT "asset_price_history_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_pair" ADD CONSTRAINT "exchange_pair_from_currency_id_currency_id_fk" FOREIGN KEY ("from_currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_pair" ADD CONSTRAINT "exchange_pair_to_currency_id_currency_id_fk" FOREIGN KEY ("to_currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rate_history" ADD CONSTRAINT "exchange_rate_history_pair_id_exchange_pair_id_fk" FOREIGN KEY ("pair_id") REFERENCES "public"."exchange_pair"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_currency" ADD CONSTRAINT "portfolio_currency_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_currency" ADD CONSTRAINT "portfolio_currency_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_market" ADD CONSTRAINT "prediction_market_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_market" ADD CONSTRAINT "prediction_market_decider_id_user_id_fk" FOREIGN KEY ("decider_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_market" ADD CONSTRAINT "prediction_market_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_market_history" ADD CONSTRAINT "prediction_market_history_prediction_market_id_prediction_market_id_fk" FOREIGN KEY ("prediction_market_id") REFERENCES "public"."prediction_market"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_market_share" ADD CONSTRAINT "prediction_market_share_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_market_share" ADD CONSTRAINT "prediction_market_share_prediction_market_id_prediction_market_id_fk" FOREIGN KEY ("prediction_market_id") REFERENCES "public"."prediction_market"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_market_share" ADD CONSTRAINT "prediction_market_share_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_portfolio_id_portfolio_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_from_currency_id_currency_id_fk" FOREIGN KEY ("from_currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_to_currency_id_currency_id_fk" FOREIGN KEY ("to_currency_id") REFERENCES "public"."currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_prediction_market_share_id_prediction_market_share_id_fk" FOREIGN KEY ("prediction_market_share_id") REFERENCES "public"."prediction_market_share"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");