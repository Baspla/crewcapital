<script lang="ts">
	import PredictionHistoryChart from '$lib/components/charts/PredictionHistoryChart.svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Container from '$lib/components/layout/Container.svelte';
	import {
		calculateWholeShareBuyPreview,
		calculateSaleAmountForShares,
		getProbabilityForMarket
	} from '$lib/predictions/utils';

	let { data, form } = $props();
	let market = $derived(data.market);
	let history = $derived(data.history);
	let userShares = $derived(data.userShares);
	let user = $derived(data.user);
	let portfolioBalance = $derived(data.portfolioBalance ?? 0);

	// Pagination for user shares
	let page = $state(1);
	const pageSize = 5;
	let paginatedShares = $derived(userShares.slice((page - 1) * pageSize, page * pageSize));
	let totalPages = $derived(Math.ceil(userShares.length / pageSize));

	let sellingShareId = $state<string | null>(null);
	let buying = $state(false);
	let buyAmount = $state('100');
	let buySide = $state<'yes' | 'no'>('yes');

	let parsedBuyAmount = $derived(Number.parseFloat(buyAmount));
	let buyPreview = $derived.by(() => {
		if (!Number.isFinite(parsedBuyAmount) || parsedBuyAmount <= 0) {
			return null;
		}

		const preview = calculateWholeShareBuyPreview(
			market.yesPool,
			market.noPool,
			parsedBuyAmount,
			buySide
		);
		if (!preview) {
			return null;
		}

		return {
			...preview,
			newProbabilityYes: getProbabilityForMarket(preview.yesPoolAfter, preview.noPoolAfter, 'yes'),
			projectedPayout: preview.wholeShares,
			projectedProfit: preview.wholeShares - preview.requiredAmount,
			leftoverBudget: parsedBuyAmount - preview.requiredAmount
		};
	});

	function getSellPreview(share: { amount: number; choice: 'yes' | 'no' }) {
		return calculateSaleAmountForShares(market.yesPool, market.noPool, share.amount, share.choice);
	}

	function formatShareAmount(amount: number) {
		return Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(4);
	}
</script>

<Container>
	<div class="space-y-6">
		<header class="space-y-3">
			<h1 class="h1">{market.title}</h1>
			<div class="flex flex-wrap items-center gap-2">
				{#if market.status !== 'pending'}
					<span
						class="badge {market.status === 'resolved'
							? 'preset-filled-success-500'
							: market.status === 'cancelled'
								? 'preset-filled-surface-500'
								: 'preset-filled-error-500'}"
					>
						{market.status.charAt(0).toUpperCase() + market.status.slice(1)}
					</span>
				{:else}
					<span class="badge preset-filled-primary-500">Active</span>
				{/if}
				{#if market.status === 'resolved' && market.result}
					<span
						class="badge {market.result === 'yes'
							? 'preset-filled-success-500'
							: market.result === 'no'
								? 'preset-filled-error-500'
								: 'preset-filled-surface-500'}"
					>
						Result: {market.result.toUpperCase()}
					</span>
				{/if}
			</div>
			<div class="text-sm opacity-80 flex flex-wrap gap-4">
				<span>Ends: {new Date(market.endDate).toLocaleDateString()}</span>
				<span>
					Current YES probability: {(getProbabilityForMarket(market.yesPool, market.noPool, 'yes') * 100).toFixed(2)}%
				</span>
				{#if market.currency}
					<span>Currency: {market.currency.symbol}</span>
				{/if}
			</div>
		</header>

		<div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
			<div class="space-y-6 min-w-0">
				<section class="card p-4 space-y-3">
					<h2 class="h3">Market History</h2>
					<div class="w-full">
						<PredictionHistoryChart {history} height="420px" />
					</div>
				</section>

				<section class="card p-4 space-y-4">
					<h2 class="h3">Your Shares</h2>
					{#if !user}
						<p class="opacity-80">Log in to view and manage your positions.</p>
					{:else if userShares.length === 0}
						<p class="opacity-80">No positions in this market yet.</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="table w-full table-auto">
								<thead>
									<tr>
										<th class="text-left">Choice</th>
										<th class="text-left">Shares</th>
										<th class="text-left">Sell Preview</th>
										<th class="text-left">Date</th>
										<th class="text-left">Action</th>
									</tr>
								</thead>
								<tbody>
									{#each paginatedShares as share (share.id)}
										<tr>
											<td>{share.choice.toUpperCase()}</td>
											<td>{formatShareAmount(share.amount)}</td>
											<td>
												{getSellPreview(share).salePrice.toFixed(4)} {market.currency?.symbol ?? ''}
											</td>
											<td>{new Date(share.createdAt).toLocaleDateString()}</td>
											<td>
												<form
													method="POST"
													action="?/sell"
													use:enhance={() => {
														sellingShareId = share.id;
														return async ({ update }) => {
															sellingShareId = null;
															await update();
														};
													}}
												>
													<input type="hidden" name="marketId" value={market.id} />
													<input type="hidden" name="shareId" value={share.id} />
													<button
														type="submit"
														class="btn preset-tonal"
														disabled={sellingShareId === share.id || market.status !== 'pending'}
													>
														{sellingShareId === share.id ? 'Selling...' : 'Sell'}
													</button>
												</form>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						{#if totalPages > 1}
							<div class="flex items-center justify-end gap-2">
								<button class="btn preset-tonal" disabled={page === 1} onclick={() => page--}>Prev</button>
								<span class="text-sm opacity-80">Page {page} of {totalPages}</span>
								<button class="btn preset-tonal" disabled={page === totalPages} onclick={() => page++}>Next</button>
							</div>
						{/if}
					{/if}
				</section>

				<section class="card p-4 space-y-3">
					<h2 class="h3">Description</h2>
					<p>{market.text}</p>
				</section>

				{#if market.deciderId === user?.id && market.status === 'pending'}
					<div>
						<a href={resolve(`/predictions/${market.id}/resolve`)} class="btn preset-filled-primary-500"
							>Resolve Market</a
						>
					</div>
				{/if}
			</div>

			<aside class="xl:sticky xl:top-4">
				<section class="card p-4 space-y-4">
					<h2 class="h3">Buy Shares</h2>
					{#if !user}
						<p class="opacity-80">Log in to buy shares.</p>
					{:else}
						<div class="text-sm opacity-80 space-y-1">
							<p>
								Available balance: {portfolioBalance.toFixed(2)} {market.currency?.symbol ?? ''}
							</p>
							<p>
								Market status: {market.status === 'pending' ? 'Open' : 'Closed'}
							</p>
						</div>

						<form
							method="POST"
							action="?/buy"
							class="space-y-3"
							use:enhance={() => {
								buying = true;
								return async ({ update }) => {
									buying = false;
									await update();
								};
							}}
						>
							<input type="hidden" name="marketId" value={market.id} />

							<label class="label" for="side">Side</label>
							<select id="side" name="side" class="select w-full" bind:value={buySide}>
								<option value="yes">YES</option>
								<option value="no">NO</option>
							</select>

							<label class="label" for="amount">Max Amount ({market.currency?.symbol ?? 'Currency'})</label>
							<input
								id="amount"
								name="amount"
								type="number"
								class="input w-full"
								step="0.01"
								min="0.01"
								bind:value={buyAmount}
								required
							/>

							{#if buyPreview}
								<div class="rounded-base preset-tonal p-3 text-sm space-y-1">
									<p>You receive {buyPreview.wholeShares} {buySide.toUpperCase()} shares (whole shares only).</p>
									<p>
										Estimated spend: {buyPreview.requiredAmount.toFixed(4)} {market.currency?.symbol ?? ''}
									</p>
									<p>
										Projected payout if {buySide.toUpperCase()} resolves: {buyPreview.projectedPayout.toFixed(0)}
										{market.currency?.symbol ?? ''}
									</p>
									<p>
										Projected profit: {buyPreview.projectedProfit.toFixed(4)} {market.currency?.symbol ?? ''}
									</p>
									<p>
										Unused budget: {buyPreview.leftoverBudget.toFixed(4)} {market.currency?.symbol ?? ''}
									</p>
									<p>
										New YES probability: {(buyPreview.newProbabilityYes * 100).toFixed(2)}%
									</p>
								</div>
							{:else}
								<p class="text-sm opacity-75">Enter a higher amount to buy at least 1 whole share.</p>
							{/if}

							<button
								type="submit"
								class="btn preset-filled-primary-500 w-full"
								disabled={buying || market.status !== 'pending' || !buyPreview || parsedBuyAmount > portfolioBalance}
							>
								{buying ? 'Buying...' : 'Buy Shares'}
							</button>
						</form>

						{#if parsedBuyAmount > portfolioBalance && Number.isFinite(parsedBuyAmount)}
							<p class="text-sm text-error-500">Insufficient balance for this amount.</p>
						{/if}
					{/if}

					{#if form?.error}
						<p class="text-sm text-error-500">{form.error}</p>
					{/if}
				</section>
			</aside>
		</div>
	</div>
</Container>

