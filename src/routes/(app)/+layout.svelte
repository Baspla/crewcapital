<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import {
		ChartNoAxesCombined,
		LayoutDashboardIcon,
		CrownIcon,
		BriefcaseBusinessIcon,
		TrendingUpDownIcon,
		TicketsIcon,
		HistoryIcon,
		PaletteIcon,
		HammerIcon,
		LogOutIcon,

		HandCoinsIcon

	} from '@lucide/svelte';
	import { Menu, Navigation, Portal } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/state';
	import LogoutButton from '$lib/components/auth/LogoutButton.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const links = [
		{ label: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
		{ label: 'Market', href: '/market', icon: TrendingUpDownIcon },
		{ label: 'Predictions', href: '/predictions', icon: TicketsIcon },
		{ label: 'Currencies', href: '/currencies', icon: HandCoinsIcon },
		{ label: 'Transactions', href: '/transactions', icon: HistoryIcon },
		{ label: 'Leaderboard', href: '/leaderboard', icon: CrownIcon }
	];

	let innerWidth: number = $state(0);

	const url = page.url;
</script>

<svelte:head
	><link rel="icon" href={favicon} />
	<title>Crew Capital</title>
</svelte:head>
<svelte:window bind:innerWidth />

	<div class="flex {innerWidth < 768 ? 'flex-col' : 'flex-row'} h-screen w-screen overflow-hidden">
		{#if innerWidth >= 768}
			<Navigation layout={'rail'} class="overflow-y-auto backdrop-blur-lg">
				<Navigation.Header>
					<Navigation.TriggerAnchor href="/" title="Crew Capital" aria-label="View Homepage">
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
						{#if data.user.isAdmin}
							<Navigation.TriggerAnchor>
								<Menu positioning={{ placement: 'right-start', strategy: 'absolute' }}>
									<Menu.Trigger class="flex flex-col items-center gap-3">
										<HammerIcon class="size-5" />
										<Navigation.TriggerText>Admin</Navigation.TriggerText>
									</Menu.Trigger>
									<Portal>
										<Menu.Positioner>
											<Menu.Content>
												<Menu.Item value="admin-overview">
													<a href="/admin" class="flex h-full w-full">
														<Menu.ItemText>Overview</Menu.ItemText></a
													>
												</Menu.Item>
												<Menu.Separator />
												<Menu.Item value="user-management">
													<a href="/admin/users" class="flex h-full w-full">
														<Menu.ItemText>Users</Menu.ItemText></a
													>
												</Menu.Item>
												<Menu.Item value="asset-management">
													<a href="/admin/assets" class="flex h-full w-full">
														<Menu.ItemText>Assets</Menu.ItemText>
													</a>
												</Menu.Item>
												<Menu.Item value="prediction-management">
													<a href="/admin/predictions" class="flex h-full w-full">
														<Menu.ItemText>Predictions</Menu.ItemText>
													</a>
												</Menu.Item>
												<Menu.Item value="portfolio-management">
													<a href="/admin/portfolios" class="flex h-full w-full">
														<Menu.ItemText>Portfolios</Menu.ItemText>
													</a>
												</Menu.Item>
												<Menu.Item value="currency-management">
													<a href="/admin/currencies" class="flex h-full w-full">
														<Menu.ItemText>Currencies</Menu.ItemText>
													</a>
												</Menu.Item>
												<Menu.Item value="exchange-rate-management">
													<a href="/admin/exchange-rates" class="flex h-full w-full">
														<Menu.ItemText>Exchange Rates</Menu.ItemText>
													</a>
												</Menu.Item>
											</Menu.Content>
										</Menu.Positioner>
									</Portal>
								</Menu>
							</Navigation.TriggerAnchor>
						{/if}
					</Navigation.Menu>
				</Navigation.Content>
				<Navigation.Footer class="flex flex-col items-center gap-2">
					<ThemeSwitcher>
						<Navigation.TriggerAnchor>
							<PaletteIcon class="size-5" />
							<Navigation.TriggerText>Themes</Navigation.TriggerText>
						</Navigation.TriggerAnchor>
					</ThemeSwitcher>
					<LogoutButton callbackURL={url.pathname}>
						<Navigation.TriggerAnchor>
							<LogOutIcon class="size-5" />
							<Navigation.TriggerText>Logout</Navigation.TriggerText>
						</Navigation.TriggerAnchor>
					</LogoutButton>
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
						<LogoutButton callbackURL={url.pathname}>
							<Navigation.TriggerAnchor>
								<LogOutIcon class="size-5" />
								<Navigation.TriggerText>Logout</Navigation.TriggerText>
							</Navigation.TriggerAnchor>
						</LogoutButton>
					</Navigation.Menu>
				</Navigation.Content>
			</Navigation>
		{/if}
	</div>