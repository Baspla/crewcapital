<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
	import CandleChart from '$lib/components/charts/CandleChart.svelte';
	import AssetIcon from '$lib/components/AssetIcon.svelte';
	import Container from '$lib/components/layout/Container.svelte';
    import { formatCurrency } from '$lib/currency';

	let { data, form } = $props();

	let buyQuantity = $state('1');
	let sellQuantity = $state('1');
	let submittingAction = $state<'buy' | 'sell' | null>(null);

	let parsedBuyQuantity = $derived(Number.parseFloat(buyQuantity));
	let parsedSellQuantity = $derived(Number.parseFloat(sellQuantity));
	let buyTotal = $derived(
		Number.isFinite(parsedBuyQuantity) && parsedBuyQuantity > 0 && data.currentPrice
			? parsedBuyQuantity * data.currentPrice
			: null
	);
	let sellTotal = $derived(
		Number.isFinite(parsedSellQuantity) && parsedSellQuantity > 0 && data.currentPrice
			? parsedSellQuantity * data.currentPrice
			: null
	);

	function handlePageChange(e: { page: number }) {
		if (!data.asset) return;

		const url = new URL(page.url);
		url.searchParams.set('page', e.page.toString());
		window.location.assign(
			`${resolve('/market/assets/[assetId]').replace('[assetId]', data.asset.id)}?${url.searchParams.toString()}`
		);
	}
</script>

{#if data.asset}
	<Container>
		<div class="mb-4 rounded-base p-4">
			<AssetIcon asset={data.asset} />
			<h2 class="mb-2 text-xl font-semibold">{data.asset.name} ({data.asset.symbol})</h2>
			<p class="mb-1"><strong>Category:</strong> {data.asset.category.name}</p>
			<p class="mb-1"><strong>Description:</strong> {data.asset.category.description}</p>
			{#if data.currentPrice}
				<p class="mb-1"><strong>Current Price:</strong> {formatCurrency(data.currentPrice, data.asset.currency)}</p>
			{/if}
			<p class="mb-1"><strong>Your Balance:</strong> {formatCurrency(data.availableBalance, data.asset.currency)}</p>
			<p class="mb-1"><strong>Your Holdings:</strong> {Math.trunc(data.ownedQuantity)} {data.asset.symbol}</p>
		</div>

		<section class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="card p-4 space-y-3">
				<h3 class="h3">Buy Asset</h3>
				<form
					method="POST"
					action="?/buy"
					class="space-y-3"
					use:enhance={() => {
						submittingAction = 'buy';
						return async ({ update }) => {
							submittingAction = null;
							await update();
						};
					}}
				>
					<label class="label" for="buy-quantity">Quantity</label>
					<input
						id="buy-quantity"
						name="quantity"
						type="number"
						class="input w-full"
						min="1"
						step="1"
						required
						bind:value={buyQuantity}
					/>

					{#if buyTotal !== null}
						<p class="text-sm opacity-80">
							Estimated total: {formatCurrency(buyTotal, data.asset.currency)}
						</p>
					{/if}

					<button
						type="submit"
						class="btn preset-filled-success-500 w-full"
						disabled={!data.currentPrice || submittingAction === 'buy'}
					>
						{submittingAction === 'buy' ? 'Buying...' : 'Buy'}
					</button>
				</form>
			</div>

			<div class="card p-4 space-y-3">
				<h3 class="h3">Sell Asset</h3>
				<form
					method="POST"
					action="?/sell"
					class="space-y-3"
					use:enhance={() => {
						submittingAction = 'sell';
						return async ({ update }) => {
							submittingAction = null;
							await update();
						};
					}}
				>
					<label class="label" for="sell-quantity">Quantity</label>
					<input
						id="sell-quantity"
						name="quantity"
						type="number"
						class="input w-full"
						min="1"
						step="1"
						required
						bind:value={sellQuantity}
					/>

					{#if sellTotal !== null}
						<p class="text-sm opacity-80">
							Estimated proceeds: {formatCurrency(sellTotal, data.asset.currency)}
						</p>
					{/if}

					<button
						type="submit"
						class="btn preset-filled-error-500 w-full"
						disabled={!data.currentPrice || submittingAction === 'sell' || data.ownedQuantity <= 0}
					>
						{submittingAction === 'sell' ? 'Selling...' : 'Sell'}
					</button>
				</form>
			</div>
		</section>

		{#if form?.successMessage}
			<p class="mb-4 text-success-500">{form.successMessage}</p>
		{/if}
		{#if form?.error}
			<p class="mb-4 text-error-500">{form.error}</p>
		{/if}

		<CandleChart data={data.assetPriceHistory} currency={data.asset.currency} />
		<h2 class="mt-6 mb-2 text-xl font-semibold">Related Transactions</h2>
		<table class="table w-full table-auto">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left">Date</th>
					<th class="px-4 py-2 text-left">Type</th>
					<th class="px-4 py-2 text-left">Total Value</th>
					<th class="px-4 py-2 text-left">Quantity</th>
					<th class="px-4 py-2 text-left">Price Per Unit</th>
				</tr>
			</thead>
			<tbody>
				{#each data.transactions as transaction (transaction.id)}
					<tr class="hover:bg-surface-500/10">
						<td class="px-4 py-2">{new Date(transaction.executedAt).toLocaleDateString()}</td>
						<td class="px-4 py-2"
							>{#if transaction.type === 'buy'}
		                        <div class="chip preset-filled-success-500">Buy</div>
							{:else if transaction.type === 'sell'}
								<div class="chip preset-filled-danger-500">Sell</div>
							{:else}
								<div class="chip preset-filled-primary-500">{transaction.type}</div>
							{/if}
						</td>
						<td class="px-4 py-2">{formatCurrency(transaction.totalValue, data.asset.currency)}</td>
						<td class="px-4 py-2">{transaction.amountOfUnits}</td>
						<td class="px-4 py-2">{formatCurrency(transaction.pricePerUnit, data.asset.currency)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="mt-4 flex justify-center">
			<Pagination
				count={data.totalCount}
				pageSize={data.pageSize}
				page={data.page}
				onPageChange={handlePageChange}
			>
				<Pagination.PrevTrigger>
					<ArrowLeftIcon class="size-4" />
				</Pagination.PrevTrigger>
				<Pagination.Context>
					{#snippet children(pagination)}
						{#each pagination().pages as page, index (page)}
							{#if page.type === 'page'}
								<Pagination.Item {...page}>
									{page.value}
								</Pagination.Item>
							{:else}
								<Pagination.Ellipsis {index}>&#8230;</Pagination.Ellipsis>
							{/if}
						{/each}
					{/snippet}
				</Pagination.Context>
				<Pagination.NextTrigger>
					<ArrowRightIcon class="size-4" />
				</Pagination.NextTrigger>
			</Pagination>
		</div>
	</Container>
{:else}
	<p class="text-red-500">Asset not found.</p>
{/if}
