<script lang="ts">
	import WorkInProgress from '$lib/components/WorkInProgress.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';

	let { data } = $props();

	function handlePageChange(e: { page: number }) {
		const url = new URL(page.url);
		url.searchParams.set('page', e.page.toString());
		goto(url);
	}


	function getTransactionTypeColor(type: string) {
		switch (type.toLowerCase()) {
			case 'buy':
			case 'deposit':
				return 'text-green-600 font-semibold';
			case 'gift':
				return 'text-yellow-600 font-semibold';
			case 'sell':
			case 'withdrawal':
			case 'payout':
				return 'text-red-600 font-semibold';
			default:
				return '';
		}
	}
</script>

<div class="relative">
	<h1 class="mb-4 text-2xl font-bold">Transactions</h1>
	<table class="table table-auto">
		<thead>
			<tr>
				<th class="p-2 text-left">Date</th>
				<th class="p-2 text-left">Type</th>
				<th class="p-2 text-left">Asset/Prediction</th>
				<th class="p-2 text-right">Amount</th>
				<th class="p-2 text-right">Price per Unit</th>
				<th class="p-2 text-right">Total Value</th>
				<th class="p-2 text-right">Notes</th>
			</tr>
		</thead>
		<tbody>
			{#each data.transactions as transaction (transaction.id)}
				<tr>
					<td class="p-2">{new Date(transaction.executedAt).toLocaleDateString()}</td>
					<td class="p-2 {getTransactionTypeColor(transaction.type)}"
						>{transaction.type.toUpperCase()}</td
					>
					<td class="p-2">
                        {#if transaction.asset}
                            {transaction.asset.symbol}
                        {:else if transaction.predictionWager}
							{transaction.predictionWager.predictionId}
						{:else}
							-
                        {/if}
                    </td>
					<td class="p-2 text-right">{transaction.amount ?? '-'}</td>
					<td class="p-2 text-right">
                        {#if transaction.pricePerUnit}
                            {transaction.pricePerUnit.toFixed(2)} {transaction.toCurrency?.symbol}
                        {:else}
                            -
                        {/if}
                    </td>
					<td class="p-2 text-right">
                        {#if transaction.totalValue}
                            {transaction.totalValue.toFixed(2)} {transaction.toCurrency?.symbol}
                        {:else}
                            -
                        {/if}
                    </td>
					<td class="p-2 text-right">{transaction.notes ?? '-'}</td>
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
</div>
