<script lang="ts">
	import { formatCurrency } from '$lib/currency';

	interface Currency {
		id: string;
		name: string;
		symbol: string;
	}
	
	interface PortfolioCurrency {
		id: string;
		amount: number;
		currency: Currency;
	}
	
	interface Asset {
		id: string;
		symbol: string;
		name: string;
	}
	
	interface AssetInventory {
		id: string;
		quantity: number;
		asset: Asset;
	}
	
	interface PredictionMarket {
		id: string;
		title: string;
	}
	
	interface PredictionMarketShare {
		id: string;
		amount: number;
		choice: 'yes' | 'no' | string;
		predictionMarket: PredictionMarket;
		currency: Currency;
	}

	interface PortfolioWithRelations {
		currencies: PortfolioCurrency[];
		inventory: AssetInventory[];
		predictionMarketShares: PredictionMarketShare[];
	}

	let { portfolio }: { portfolio: PortfolioWithRelations } = $props();
</script>

<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
	<!-- Money Section -->
	<div class="card p-4 space-y-4 shadow-lg preset-outlined-surface-200-800 bg-surface-50-950">
		<header class="flex justify-between items-center border-b pb-2 mb-2 border-surface-200-800">
			<h3 class="h3 font-bold">Money</h3>
		</header>
		{#if !portfolio.currencies || portfolio.currencies.length === 0}
			<p class="text-surface-600-400 italic">No currencies available.</p>
		{:else}
			<ul class="list-none space-y-2">
				{#each portfolio.currencies as item (item.id)}
					<li class="flex justify-between items-center p-2 rounded-container hover:bg-surface-200-800 transition-colors">
						<span class="font-semibold">{item.currency.name}</span>
						<span class="font-mono text-surface-900-100">{formatCurrency(item.amount, item.currency)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Stocks Section -->
	<div class="card p-4 space-y-4 shadow-lg preset-outlined-surface-200-800 bg-surface-50-950">
		<header class="flex justify-between items-center border-b pb-2 mb-2 border-surface-200-800">
			<h3 class="h3 font-bold">Stocks</h3>
		</header>
		{#if !portfolio.inventory || portfolio.inventory.length === 0}
			<p class="text-surface-600-400 italic">No stocks in portfolio.</p>
		{:else}
			<ul class="list-none space-y-2">
				{#each portfolio.inventory as item (item.id)}
					<li class="flex justify-between items-center p-2 rounded-container hover:bg-surface-200-800 transition-colors">
						<div class="flex flex-col">
							<span class="font-semibold">{item.asset.symbol}</span>
							<span class="text-xs text-surface-600-400">{item.asset.name}</span>
						</div>
						<span class="font-mono text-surface-900-100">{item.quantity} units</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Predictions Section -->
	<div class="card p-4 space-y-4 shadow-lg preset-outlined-surface-200-800 bg-surface-50-950">
		<header class="flex justify-between items-center border-b pb-2 mb-2 border-surface-200-800">
			<h3 class="h3 font-bold">Predictions</h3>
		</header>
		{#if !portfolio.predictionMarketShares || portfolio.predictionMarketShares.length === 0}
			<p class="text-surface-600-400 italic">No active predictions.</p>
		{:else}
			<ul class="list-none space-y-2">
				{#each portfolio.predictionMarketShares as share (share.id)}
					<li class="flex flex-col p-2 rounded-container hover:bg-surface-200-800 transition-colors space-y-1">
						<span class="font-bold truncate" title={share.predictionMarket.title}>{share.predictionMarket.title}</span>
						<div class="flex justify-between text-sm">
							<span class="opacity-80">Choice: <span class="uppercase font-bold text-primary-600-400">{share.choice}</span></span>
							<span class="font-mono text-surface-900-100">{formatCurrency(share.amount, share.currency)}</span>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
