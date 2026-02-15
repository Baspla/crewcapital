<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { DatePicker, Pagination, Portal } from '@skeletonlabs/skeleton-svelte';
	import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
	import CandleChart from '$lib/components/charts/CandleChart.svelte';
	import Container from '$lib/components/layout/Container.svelte';

	let { data, form } = $props();
    let dateRange = $state<any[]>([]);

	function handlePageChange(e: { page: number }) {
		const url = new URL(page.url);
		url.searchParams.set('page', e.page.toString());
		goto(url);
	}
</script>

{#if data.asset}
	<Container>
		<a href="/market/assets/{data.asset.id}" class="btn preset">
			To Asset Page
		</a>
		<div class="mb-4 rounded-base border p-4">
			<h2 class="mb-2 text-xl font-semibold">{data.asset.name} ({data.asset.symbol})</h2>
			<p class="mb-1"><strong>Category:</strong> {data.asset.category.name}</p>
			<p class="mb-1"><strong>Description:</strong> {data.asset.category.description}</p>
		</div>
		
  		<CandleChart data={data.assetPriceHistory} currency={data.asset.currency} />

		<DatePicker selectionMode="range" onValueChange={(e) => dateRange = e.value}>
	<DatePicker.Label>Select Date Range</DatePicker.Label>
	<DatePicker.Control>
		<DatePicker.Input index={0} placeholder="Start date..." />
		<DatePicker.Input index={1} placeholder="End date..." />
		<DatePicker.Trigger />
	</DatePicker.Control>
	<Portal>
		<DatePicker.Positioner>
			<DatePicker.Content>
				<DatePicker.View view="day">
					<DatePicker.Context>
						{#snippet children(datePicker)}
							<DatePicker.ViewControl>
								<DatePicker.PrevTrigger />
								<DatePicker.ViewTrigger>
									<DatePicker.RangeText />
								</DatePicker.ViewTrigger>
								<DatePicker.NextTrigger />
							</DatePicker.ViewControl>
							<DatePicker.Table>
								<DatePicker.TableHead>
									<DatePicker.TableRow>
										{#each datePicker().weekDays as weekDay, id (id)}
											<DatePicker.TableHeader>{weekDay.short}</DatePicker.TableHeader>
										{/each}
									</DatePicker.TableRow>
								</DatePicker.TableHead>
								<DatePicker.TableBody>
									{#each datePicker().weeks as week, id (id)}
										<DatePicker.TableRow>
											{#each week as day, id (id)}
												<DatePicker.TableCell value={day}>
													<DatePicker.TableCellTrigger>{day.day}</DatePicker.TableCellTrigger>
												</DatePicker.TableCell>
											{/each}
										</DatePicker.TableRow>
									{/each}
								</DatePicker.TableBody>
							</DatePicker.Table>
						{/snippet}
					</DatePicker.Context>
				</DatePicker.View>
				<DatePicker.View view="month">
					<DatePicker.Context>
						{#snippet children(datePicker)}
							<DatePicker.ViewControl>
								<DatePicker.PrevTrigger />
								<DatePicker.ViewTrigger>
									<DatePicker.RangeText />
								</DatePicker.ViewTrigger>
								<DatePicker.NextTrigger />
							</DatePicker.ViewControl>
							<DatePicker.Table>
								<DatePicker.TableBody>
									{#each datePicker().getMonthsGrid({ columns: 4, format: 'short' }) as months, id (id)}
										<DatePicker.TableRow>
											{#each months as month, id (id)}
												<DatePicker.TableCell value={month.value}>
													<DatePicker.TableCellTrigger>{month.label}</DatePicker.TableCellTrigger>
												</DatePicker.TableCell>
											{/each}
										</DatePicker.TableRow>
									{/each}
								</DatePicker.TableBody>
							</DatePicker.Table>
						{/snippet}
					</DatePicker.Context>
				</DatePicker.View>
				<DatePicker.View view="year">
					<DatePicker.Context>
						{#snippet children(datePicker)}
							<DatePicker.ViewControl>
								<DatePicker.PrevTrigger />
								<DatePicker.ViewTrigger>
									<DatePicker.RangeText />
								</DatePicker.ViewTrigger>
								<DatePicker.NextTrigger />
							</DatePicker.ViewControl>
							<DatePicker.Table>
								<DatePicker.TableBody>
									{#each datePicker().getYearsGrid({ columns: 4 }) as years, id (id)}
										<DatePicker.TableRow>
											{#each years as year, id (id)}
												<DatePicker.TableCell value={year.value}>
													<DatePicker.TableCellTrigger>{year.label}</DatePicker.TableCellTrigger>
												</DatePicker.TableCell>
											{/each}
										</DatePicker.TableRow>
									{/each}
								</DatePicker.TableBody>
							</DatePicker.Table>
						{/snippet}
					</DatePicker.Context>
				</DatePicker.View>
			</DatePicker.Content>
		</DatePicker.Positioner>
	</Portal>
</DatePicker>

		<form method="POST" action="?/fetchHistory" use:enhance class="mt-4 flex flex-col gap-2 items-start">
			<input type="hidden" name="startDate" value={dateRange[0]?.toString()} />
			<input type="hidden" name="endDate" value={dateRange[1]?.toString()} />
			<button type="submit" class="btn preset-filled-primary-500" disabled={!dateRange[0] || !dateRange[1]}>
				Fetch History
			</button>
		</form>

		<form method="POST" action="?/fetchHistory" use:enhance class="mt-4 flex flex-col gap-2 items-start">
			<input type="hidden" name="startDate" value={new Date(new Date().setFullYear(new Date().getFullYear() -1)).toISOString()} />
			<input type="hidden" name="endDate" value={new Date().toISOString()} />
			<button type="submit" class="btn preset-filled-primary-500">
				Fetch History Past Year
			</button>
		</form>
		{#if form?.success && form?.count}
			<div class="mt-4 p-4 border rounded-base bg-surface-500/5">
				<h3 class="font-semibold mb-2">Historical Data Fetched</h3>
				<p>Found {form.count} records.</p>
			</div>
		{:else if form?.error}
			<div class="mt-4 p-4 border rounded-base bg-error-500/10 text-error-500">
				Error: {form.error}
			</div>
		{/if}

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
