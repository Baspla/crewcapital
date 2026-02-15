<script lang="ts">
	import { enhance } from '$app/forms';
	import Container from '$lib/components/layout/Container.svelte';

	let { data, form } = $props();
	let currencies = $derived(data.currencies);
	let assets = $derived(data.assets);
	let loading = $state(false);
	let marketType = $state('manual'); // 'manual' | 'asset'
</script>

<Container>
	<h1 class="text-3xl font-bold mb-6">Create New Prediction Market</h1>

	{#if form?.error}
		<div class="text-error-500 mb-4">{form.error}</div>
	{/if}
	{#if form?.missing}
		<div class="text-error-500 mb-4">Please fill in all fields.</div>
	{/if}

	<div class="mb-6 flex gap-4 border-b border-surface-500/30">
		<button 
			class="px-4 py-2 border-b-2 transition-colors {marketType === 'manual' ? 'border-primary-500 text-primary-500 font-bold' : 'border-transparent hover:border-surface-400'}"
			onclick={() => marketType = 'manual'}
			type="button"
		>
			Manual Market
		</button>
		<button 
			class="px-4 py-2 border-b-2 transition-colors {marketType === 'asset' ? 'border-primary-500 text-primary-500 font-bold' : 'border-transparent hover:border-surface-400'}"
			onclick={() => marketType = 'asset'}
			type="button"
		>
			Asset Price Market
		</button>
	</div>

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				update();
			};
		}}
	>
		<input type="hidden" name="type" value={marketType} />

		{#if marketType === 'manual'}
			<div class="mb-4">
				<label for="title" class="block mb-1 font-semibold">Title</label>
				<input
					id="title"
					name="title"
					required
					placeholder="e.g. Will there be world peace by 2030?"
					class="input"
				/>
			</div>
			<div class="mb-4">
				<label for="text" class="block mb-1 font-semibold">Description</label>
				<textarea id="text" name="text" required rows="3" class="input"
					placeholder="Provide the exact criteria for how this prediction will be resolved."
				></textarea>
			</div>
		{:else}
			<div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="assetId" class="block mb-1 font-semibold">Asset</label>
					<select id="assetId" name="assetId" required class="select p-2 w-full">
						{#each assets as asset (asset.id)}
							<option value={asset.id}>{asset.name} ({asset.symbol})</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="targetPrice" class="block mb-1 font-semibold">Target Price</label>
					<input
						id="targetPrice"
						name="targetPrice"
						type="number"
						step="any"
						required
						class="input"
						placeholder="e.g. 50000"
					/>
				</div>
				<div>
					<label for="direction" class="block mb-1 font-semibold">Direction</label>
					<select id="direction" name="direction" required class="select p-2 w-full">
						<option value="above">Above Target Price</option>
						<option value="below">Below Target Price</option>
					</select>
				</div>
			</div>
		{/if}

		<div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="endDate" class="block mb-1 font-semibold">End Date</label>
				<input id="endDate" name="endDate" type="datetime-local" required class="input" />
			</div>
			<div>
				<label for="currencyId" class="block mb-1 font-semibold">Currency (Wager)</label>
				<select id="currencyId" name="currencyId" required class="select p-2 w-full">
					{#each currencies as currency (currency.id)}
						<option value={currency.id}>{currency.name} ({currency.symbol})</option>
					{/each}
				</select>
			</div>
		</div>

		<button type="submit" disabled={loading} class="btn preset-filled-primary-500 w-full md:w-auto">
			{loading ? 'Creating Market...' : 'Create Market'}
		</button>
	</form>
</Container>
