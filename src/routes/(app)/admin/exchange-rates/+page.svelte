<script lang="ts">
	import { enhance } from '$app/forms';
	// @ts-ignore
	import type { PageData, ActionData } from './$types';
	import Container from '$lib/components/layout/Container.svelte';

	let { data, form }: { data: PageData, form: ActionData } = $props();

	let creating = $state(false);

	let fromCurrencyId = $state('');
	let toCurrencyId = $state('');
	let manualSymbol = $state(false);
	let symbol = $state('');

	// Derived
	let selectedFromCurrency = $derived(data.currencies?.find(c => c.id === fromCurrencyId));
	let selectedToCurrency = $derived(data.currencies?.find(c => c.id === toCurrencyId));
	
	// Determine if we need a static rate based on whether either currency is NOT real world
	let isVirtualPair = $derived(
		(selectedFromCurrency && !selectedFromCurrency.isRealWorld) || 
		(selectedToCurrency && !selectedToCurrency.isRealWorld)
	);

	$effect(() => {
		if (!manualSymbol && fromCurrencyId && toCurrencyId) {
			symbol = `${fromCurrencyId}${toCurrencyId}`;
		}
	});

	function toggleManualSymbol() {
		manualSymbol = !manualSymbol;
	}
</script>

<Container>
	<div class="space-y-4 p-4">
		<header class="flex justify-between items-center">
			<h2 class="h2">Manage Exchange Rates</h2>
			<button class="btn preset-filled-primary-500" onclick={() => creating = !creating}>
				{creating ? 'Cancel' : 'Add Rate'}
			</button>
		</header>

		{#if form?.error}
			<div class="alert preset-filled-error">
				<span>{form.error}</span>
			</div>
		{/if}

		{#if creating}
			<div class="card p-4 space-y-4 bg-surface-100-800-token">
				<form method="POST" action="?/create" use:enhance class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<label class="label">
							<span>From Currency</span>
							<select class="select" name="fromCurrencyId" bind:value={fromCurrencyId} required>
								<option value="" disabled selected>Select Currency</option>
								{#each data.currencies as currency}
									<option value={currency.id}>
										{currency.name} ({currency.id})
										{!currency.isRealWorld ? '(Virtual)' : ''}
									</option>
								{/each}
							</select>
						</label>
						<label class="label">
							<span>To Currency</span>
							<select class="select" name="toCurrencyId" bind:value={toCurrencyId} required>
								<option value="" disabled selected>Select Currency</option>
								{#each data.currencies as currency}
									<option value={currency.id}>
										{currency.name} ({currency.id})
										{!currency.isRealWorld ? '(Virtual)' : ''}
									</option>
								{/each}
							</select>
						</label>
					</div>

					<label class="label">
						<span>Symbol (Unique)</span>
						<div class="input-group input-group-divider grid-cols-[1fr_auto]">
							<input type="text" name="symbol" bind:value={symbol} placeholder="EURUSD" required />
							<button type="button" class="preset-filled-secondary-500" onclick={toggleManualSymbol}>
								{manualSymbol ? 'Auto' : 'Manual'}
							</button>
						</div>
						<small class="opacity-50">Auto-generated as FROMTO usually.</small>
					</label>

					<label class="label">
						<span>Static Conversion Rate</span>
						<input class="input" type="number" step="0.00000001" name="staticConversionRate" placeholder="1.0" 
							required={isVirtualPair} /> <!-- Required if virtual pair -->
						{#if isVirtualPair}
							<small class="text-warning-500">Required because one or both currencies are virtual.</small>
						{/if}
					</label>
					
					<div class="flex justify-end">
						<button type="submit" class="btn preset-filled-primary-500">Save Exchange Rate</button>
					</div>
				</form>
			</div>
		{/if}

		<div class="table-container">
			<table class="table table-hover">
				<thead>
					<tr>
						<th>Symbol</th>
						<th>Pair</th>
						<th>Static Rate</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.exchangeRates as rate}
						<tr>
							<td>{rate.symbol}</td>
							<td>
								{rate.fromCurrency.name} ({rate.fromCurrency.id}) 
								<span class="opacity-50">→</span> 
								{rate.toCurrency.name} ({rate.toCurrency.id})
							</td>
							<td>{rate.staticConversionRate ?? '-'}</td>
							<td>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={rate.id} />
									<button class="btn btn-sm preset-filled-error-500">Delete</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</Container>
