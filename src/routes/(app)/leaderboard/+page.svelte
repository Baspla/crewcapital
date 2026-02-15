<script lang="ts">
	import { formatCurrency } from '$lib/currency.js';
	import { ArrowUp, ArrowDown } from '@lucide/svelte';
	import Container from '$lib/components/layout/Container.svelte';

	let { data } = $props();

	let sortState = $state<{ column: string; direction: 'asc' | 'desc' }>({
		column: 'name',
		direction: 'asc'
	});

	let sortedLeaderboard = $derived.by(() => {
		const users = [...data.leaderboard];
		return users.sort((a, b) => {
			const { column, direction } = sortState;
			const mult = direction === 'asc' ? 1 : -1;

			if (column === 'name') {
				return a.name.localeCompare(b.name) * mult;
			}
			
			// Otherwise sorting by currency balance
			const valA = a.balances[column] ?? 0;
			const valB = b.balances[column] ?? 0;
			return (valA - valB) * mult;
		});
	});

	function handleSort(column: string) {
		if (sortState.column === column) {
			sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
		} else {
			sortState.column = column;
			// Default to descending for values, ascending for text
			sortState.direction = column === 'name' ? 'asc' : 'desc';
		}
	}
</script>

<Container>
	<h2 class="text-3xl font-bold mb-4">Leaderboard</h2>
	
	<div class="table-container">
		<table class="table table-hover w-full table-auto">
			<thead>
				<tr>
					<th class="cursor-pointer select-none" onclick={() => handleSort('name')}>
						<div class="flex items-center gap-2">
							User
							{#if sortState.column === 'name'}
								{#if sortState.direction === 'asc'}
									<ArrowUp size={16} />
								{:else}
									<ArrowDown size={16} />
								{/if}
							{/if}
						</div>
					</th>
					{#each data.currencies as currency (currency.id)}
						<th class="text-right cursor-pointer select-none" onclick={() => handleSort(currency.symbol)}>
							<div class="flex items-center justify-end gap-2">
								{currency.name}
								{#if sortState.column === currency.symbol}
									{#if sortState.direction === 'asc'}
										<ArrowUp size={16} />
									{:else}
										<ArrowDown size={16} />
									{/if}
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each sortedLeaderboard as user (user.id)}
					<tr>
						<td>
							<div class="flex items-center gap-2">
								{#if user.image}
									<img
										src={user.image}
										alt={user.name}
										class="h-8 w-8 rounded-full object-cover"
									/>
								{:else}
									<div class="bg-surface-300 h-8 w-8 rounded-full flex items-center justify-center">
										<span class="text-xs">{user.name.charAt(0)}</span>
									</div>
								{/if}
								<span>{user.name}</span>
							</div>
						</td>
						{#each data.currencies as currency (currency.id)}
							<td class="text-right">
								{formatCurrency(user.balances[currency.symbol] ?? 0, currency)}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Container>
