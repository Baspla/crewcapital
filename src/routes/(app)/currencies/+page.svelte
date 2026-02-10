<script lang="ts">
	import WorkInProgress from '$lib/components/WorkInProgress.svelte';
	import { page } from '$app/state';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
</script>

<div class="">
	<h1 class="text-2xl font-bold mb-4">Portfolio</h1>
	<h2 class="text-xl font-semibold mb-2">Stocks</h2>
	<table>
		<thead>
			<tr>
				<th class="p-2 text-left">Position</th>
				<th class="p-2 text-right">Amount</th>
				<th class="p-2 text-right">Price</th>
				<th class="p-2 text-right">Total Value</th>
			</tr>
		</thead>
		<tbody>
			{#each page.data.portfolio.stocks as item (item.id)}
				<tr>
					<td class="p-2">{item.asset}</td>
					<td class="p-2 text-right">{item.amount}</td>
					<td class="p-2 text-right">{item.pricePerUnitEur.toFixed(2)}€</td>
					<td class="p-2 text-right">{item.valueEur.toFixed(2)}€</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<h2 class="text-xl font-semibold mt-6 mb-2">Commodities</h2>
	<table>
		<thead>
			<tr>
				<th class="p-2 text-left">Position</th>
				<th class="p-2 text-right">Amount</th>
				<th class="p-2 text-right">Price</th>
				<th class="p-2 text-right">Total Value</th>
			</tr>
		</thead>
		<tbody>
			{#each page.data.portfolio.commodities as item (item.id)}
				<tr>
					<td class="p-2">{item.asset}</td>
					<td class="p-2 text-right">{item.amount}</td>
					<td class="p-2 text-right">{item.pricePerUnitEur.toFixed(2)}€</td>
					<td class="p-2 text-right">{item.valueEur.toFixed(2)}€</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<h2 class="text-xl font-semibold mt-6 mb-2">Freeform Predictions</h2>
	<table>
		<thead>
			<tr>
				<th class="p-2 text-left">Prediction</th>
				<th class="p-2 text-right">Your Prediction</th>
				<th class="p-2 text-right">Amount</th>
				<th class="p-2 text-right">Aligned Volume</th>
				<th class="p-2 text-right">Opposed Volume</th>
				<th class="p-2 text-right">Potential Earnings</th>
				<th class="p-2 text-right">Result</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td class="p-2">Obamna 2028</td>
				<td class="p-2 text-right"><span class="text-green-600">Win</span></td>
				<td class="p-2 text-right">100€</td>
				<td class="p-2 text-right">500€</td>
				<td class="p-2 text-right">1500€</td>
				<td class="p-2 text-right">300€</td>
				<td class="p-2 text-right">Undetermined</td>
			</tr>
		</tbody>
	</table>
	<h2 class="text-xl font-semibold mt-6 mb-2">Asset Predictions</h2>
	<table>
		<thead>
			<tr>
				<th class="p-2 text-left">Prediction</th>
				<th class="p-2 text-right">Date</th>
				<th class="p-2 text-right">Your Prediction</th>
				<th class="p-2 text-right">Amount</th>
				<th class="p-2 text-right">Volume</th>
				<th class="p-2 text-right">Potential Earnings</th>
				<th class="p-2 text-right">Result</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td class="p-2">Gold über 200€</td>
				<td class="p-2">10.02.2026</td>
				<td class="p-2 text-right"><span class="text-green-600">Yes</span></td>
				<td class="p-2 text-right">100€</td>
				<td class="p-2 text-right">500€:1500€</td>
				<td class="p-2 text-right">200€</td>
				<td class="p-2 text-right">Undetermined</td>
			</tr>
		</tbody>
	</table>
</div>