<script lang="ts">
	import {
		CheckIcon,
		SettingsIcon
	} from '@lucide/svelte';
	import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
	import { invalidateAll } from '$app/navigation';

	interface Portfolio {
		id: string;
		name: string;
	}

	interface Props {
		portfolios: Portfolio[];
		selectedPortfolio?: Portfolio;
		children: any;
	}

	let { portfolios, selectedPortfolio, children }: Props = $props();

	function selectPortfolio(id: string) {
		document.cookie = `selected_portfolio_id=${id}; path=/; max-age=31536000`;
		invalidateAll();
	}
</script>

<Menu positioning={{ placement: 'bottom-start', strategy: 'absolute' }}>
	<Menu.Trigger class="w-full">
		{@render children()}
	</Menu.Trigger>

	<Portal>
		<Menu.Positioner>
			<Menu.Content class="w-64 p-4 rounded-container">
				<div class="space-y-2 overflow-y-auto p-1 ">
					{#each portfolios as portfolio (portfolio.id)}
						<button
							type="button"
							class="flex w-full items-center justify-between p-3"
							onclick={() => selectPortfolio(portfolio.id)}
						>
							<span class="truncate">{portfolio.name}</span>
							{#if selectedPortfolio?.id === portfolio.id}
								<CheckIcon class="size-4" />
							{/if}
						</button>
					{/each}
                    {#if portfolios.length === 0}
                         <div class="p-2 text-sm opacity-50">No portfolios found</div>
                    {/if}
				</div>
				<hr class="my-2 border-surface-200-800" />
				<a
					href="/manageportfolios"
					class="flex w-full items-center gap-2 p-2 rounded-base transition-colors hover:bg-surface-100-800 text-sm"
				>
					<SettingsIcon class="size-4" />
					<span>Manage Portfolios</span>
				</a>
			</Menu.Content>
		</Menu.Positioner>
	</Portal>
</Menu>
