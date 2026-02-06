<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import WorkInProgress from '$lib/components/WorkInProgress.svelte';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { ArrowLeftIcon, ArrowRightIcon, RefreshCwIcon } from '@lucide/svelte';
	import AssetIcon from '$lib/components/AssetIcon.svelte';
	import SimpleChart from '$lib/components/charts/SimpleChart.svelte';

	let { form, data } = $props();

	// Calculate total pages
	// Note: In Svelte 5 with $app/state, page.data is reactive.
	// We can use a derived rune if we want, or just expressions in template.
	let totalPages = $derived(Math.ceil((page.data.totalCount || 0) / (page.data.pageSize || 10)));

	function handlePageChange(e: { page: number }) {
		const url = new URL(page.url);
		url.searchParams.set('page', e.page.toString());
		goto(url);
	}

</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold inline-flex items-center ">
		Testing
		<WorkInProgress class="size-10" />
	</h1>
	<h2 class="mt-6 mb-2 text-xl font-semibold">Add Asset</h2>

	<form method="POST" action="?/addAsset" use:enhance class="flex items-center">
		<input
			type="text"
			name="ticker"
			placeholder="Enter TICKER symbol"
			class="me-2 rounded-base preset-outlined bg-surface-200-800 p-2"
			required
		/>
		<button class="rounded-base preset-filled px-4 py-2 transition" type="submit">
			Add Asset
		</button>
	</form>

	{#if form?.success}
		<p class="mt-2 text-green-500">Successfully added {form.symbol}!</p>
	{:else if form?.error}
		<p class="mt-2 text-red-500">Error: {form.error}</p>
	{/if}

	<h2 class="mt-6 mb-2 text-xl font-semibold">Assets</h2>
	<table class="table table-auto w-full">
		<thead>
			<tr>
				<th class="px-4 py-2 text-left">Logo</th>
				<th class="px-4 py-2 text-left">Ticker</th>
				<th class="px-4 py-2 text-left">Name</th>
				<th class="px-4 py-2 text-left">Chart</th>
				<th class="px-4 py-2 text-left">Category</th>
				<th class="px-4 py-2 text-left">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each page.data.assets as asset (asset.id)}
				<tr>
					<td class="px-4 py-2">
						<AssetIcon asset={asset} class="size-6" shape="rounded" />
					</td>
					<td class="px-4 py-2">{asset.symbol}</td>
					<td class="px-4 py-2"><a href="/admin/assets/{asset.id}">{asset.name}</a></td>
					<td class="px-4 py-2">
						<SimpleChart
							data={asset.priceHistory}
							height="50px"
							currency={asset.currency}
						/>
					</td>
					<td class="px-4 py-2">{asset.category.name}</td>
					<td class="px-4 py-2 flex items-center gap-2">
						<button class="rounded-base preset-filled bg-primary-200-800 text-primary-contrast-light px-2 py-1 transition">
							Update
						</button>
						<form method="POST" action="?/refreshHistory" use:enhance>
							<input type="hidden" name="assetId" value={asset.id} />
							<button class="rounded-base preset-filled bg-secondary-200-800 px-2 py-1 transition text-white" title="Fetch 1y History">
								<RefreshCwIcon class="size-4" />
							</button>
						</form>
						<button class="rounded-base preset-outlined bg-error-200-800 px-2 py-1 transition">
							Delete
						</button>
					</td>
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
