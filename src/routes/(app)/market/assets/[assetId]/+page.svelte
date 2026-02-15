<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
  	import CandleChart from '$lib/components/charts/CandleChart.svelte';
	import AssetIcon from '$lib/components/AssetIcon.svelte';
	import Container from '$lib/components/layout/Container.svelte';

	let { data } = $props();

	function handlePageChange(e: { page: number }) {
		const url = new URL(page.url);
		url.searchParams.set('page', e.page.toString());
		goto(url);
	}
</script>

{#if data.asset}
	<Container>
		<div class="mb-4 rounded-base p-4">
			<AssetIcon asset={data.asset} />
			<h2 class="mb-2 text-xl font-semibold">{data.asset.name} ({data.asset.symbol})</h2>
			<p class="mb-1"><strong>Category:</strong> {data.asset.category.name}</p>
			<p class="mb-1"><strong>Description:</strong> {data.asset.category.description}</p>
		</div>
  		<CandleChart data={data.assetPriceHistory} currency={data.asset.currency} />
		<h2 class="mt-6 mb-2 text-xl font-semibold">Related Transactions</h2>
		<table class="table w-full table-auto">
			<thead>
				<tr>
					<th class="px-4 py-2 text-left">Date</th>
					<th class="px-4 py-2 text-left">Type</th>
					<th class="px-4 py-2 text-left">Amount</th>
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
						<td class="px-4 py-2">{transaction.totalValue}</td>
						<td class="px-4 py-2">{transaction.pricePerUnit}</td>
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
