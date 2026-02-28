<script lang="ts">
	import type { PageData } from './$types';
	import ExchangeCard from './ExchangeCard.svelte';

	let { data }: { data: PageData } = $props();

	// Find the full portfolio object (with balances) that matches the selected ID from layout
	let selectedPortfolio = $derived(
		data.portfolios.find((p) => p.id === data.selectedPortfolio?.id)
	);
</script>

<div class="container h-full mx-auto flex justify-center items-center p-4">
	<div class="space-y-10 text-center flex flex-col items-center">
		<h2 class="h2">Currency Exchange</h2>
		
		{#if !selectedPortfolio}
			<p>Please select a portfolio to exchange currencies.</p>
		{:else if data.pairs.length === 0}
			<p>No exchange pairs available.</p>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each data.pairs as pair}
					<div class="w-full max-w-sm">
						<ExchangeCard {pair} portfolio={selectedPortfolio} />
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
