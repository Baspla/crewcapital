<script lang="ts">
	import { enhance } from '$app/forms';
	// @ts-ignore
	import type { PageData, ActionData } from './$types';
	import Container from '$lib/components/layout/Container.svelte';

	let { data, form }: { data: PageData, form: ActionData } = $props();

	let creating = $state(false);
</script>

<Container>
	<div class="space-y-4 p-4">
		<header class="flex justify-between items-center">
			<h2 class="h2">Manage Currencies</h2>
			<button class="btn preset-filled-primary-500" onclick={() => creating = !creating}>
				{creating ? 'Cancel' : 'Add Currency'}
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
					<label class="label">
						<span>Currency Code (ID)</span>
						<input class="input" type="text" name="id" placeholder="USD" required minlength="3" maxlength="3" />
					</label>
					<label class="label">
						<span>Name</span>
						<input class="input" type="text" name="name" placeholder="US Dollar" required />
					</label>
					<label class="label">
						<span>Symbol</span>
						<input class="input" type="text" name="symbol" placeholder="$" required />
					</label>
					<label class="flex items-center space-x-2">
						<input class="checkbox" type="checkbox" name="isRealWorld" checked />
						<span>Is Real World Currency</span>
					</label>
					<div class="flex justify-end">
						<button type="submit" class="btn preset-filled-primary-500">Save Currency</button>
					</div>
				</form>
			</div>
		{/if}

		<div class="table-container">
			<table class="table table-hover">
				<thead>
					<tr>
						<th>Code</th>
						<th>Name</th>
						<th>Symbol</th>
						<th>Type</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.currencies as currency}
						<tr>
							<td>{currency.id}</td>
							<td>{currency.name}</td>
							<td>{currency.symbol}</td>
							<td>
								{#if currency.isRealWorld}
									<span class="badge preset-filled-success-500">Real World</span>
								{:else}
									<span class="badge preset-filled-secondary-500">Virtual</span>
								{/if}
							</td>
							<td>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={currency.id} />
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
