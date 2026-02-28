<script lang="ts">
	import Container from '$lib/components/layout/Container.svelte';
	import PortfolioView from '$lib/components/portfolio/PortfolioView.svelte';

	let { data } = $props();
</script>

<Container>
	<h1 class="text-3xl font-bold mb-4">Portfolio</h1>

	{#if data.portfolio}
		<PortfolioView portfolio={data.portfolio} />
	{:else}
		<section class="card p-4 space-y-4 variant-soft-surface">
			<p>No portfolio found for this user.</p>
		</section>
	{/if}
</Container>