<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import {
		ChartNoAxesCombined,
		LayoutDashboardIcon,
		CrownIcon,
		BriefcaseBusinessIcon,
		TrendingUpDownIcon,
		TicketsIcon,
		HistoryIcon,
		PaletteIcon
	} from '@lucide/svelte';
	import { Navigation } from '@skeletonlabs/skeleton-svelte';

	const links = [
		{ label: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
		{ label: 'Market', href: '/market', icon: TrendingUpDownIcon },
		{ label: 'Predictions', href: '/predictions', icon: TicketsIcon },
		{ label: 'Portfolios', href: '/portfolios', icon: BriefcaseBusinessIcon },
		{ label: 'Transactions', href: '/transactions', icon: HistoryIcon },
		{ label: 'Leaderboard', href: '/leaderboard', icon: CrownIcon }
	];

	let { children } = $props();
	let innerWidth: number = $state(0);
</script>

<svelte:head
	><link rel="icon" href={favicon} />
	<title>Gnag Exchange</title>
</svelte:head>
<svelte:window bind:innerWidth />
<div class="flex {innerWidth < 768 ? 'flex-col' : 'flex-row'} h-screen w-screen overflow-hidden">
	{#if innerWidth >= 768}
		<Navigation layout={'rail'} class="backdrop-blur-lg">
			<Navigation.Header>
				<Navigation.TriggerAnchor href="/" title="Gnag Exchange" aria-label="View Homepage">
					<ChartNoAxesCombined class="size-8" />
				</Navigation.TriggerAnchor>
			</Navigation.Header>
			<Navigation.Content>
				<Navigation.Menu>
					{#each links as link (link.href)}
						{@const Icon = link.icon}
						<Navigation.TriggerAnchor href={link.href}>
							<Icon class="size-5" />
							<Navigation.TriggerText>{link.label}</Navigation.TriggerText>
						</Navigation.TriggerAnchor>
					{/each}
				</Navigation.Menu>
			</Navigation.Content>
			<Navigation.Footer class="flex flex-col items-center">
				<ThemeSwitcher>
					<Navigation.TriggerAnchor>
						<PaletteIcon class="size-5" />
						<Navigation.TriggerText>Themes</Navigation.TriggerText>
					</Navigation.TriggerAnchor>
				</ThemeSwitcher>
			</Navigation.Footer>
		</Navigation>
		<div class="flex h-full w-full overflow-auto p-6">
			{@render children()}
		</div>
	{:else}
		<div class="flex h-full w-full overflow-auto p-6">
			{@render children()}
		</div>
		<Navigation layout={'bar'} class="overflow-y-hidden backdrop-blur-lg">
			<Navigation.Content>
				<Navigation.Menu class="flex w-full justify-around overflow-x-auto">
					{#each links as link (link.href)}
						{@const Icon = link.icon}
						<Navigation.TriggerAnchor href={link.href}>
							<Icon class="size-5" />
							<Navigation.TriggerText>{link.label}</Navigation.TriggerText>
						</Navigation.TriggerAnchor>
					{/each}
					<ThemeSwitcher>
						<Navigation.TriggerAnchor>
							<PaletteIcon class="size-5" />
							<Navigation.TriggerText>Themes</Navigation.TriggerText>
						</Navigation.TriggerAnchor>
					</ThemeSwitcher>
				</Navigation.Menu>
			</Navigation.Content>
		</Navigation>
	{/if}
</div>
