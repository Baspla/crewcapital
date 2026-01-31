<script lang="ts">
	import {
		XIcon,
		MoonIcon,
		SunIcon,
		MonitorIcon
	} from '@lucide/svelte';
	import { Dialog, Portal, SegmentedControl } from '@skeletonlabs/skeleton-svelte';
	import { onMount } from 'svelte';

	const HREF_BONUS = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

	// Define your available themes (ensure these are imported in your app.css)
	const themes = [
		{ id: 'cerberus', name: 'Cerberus', icon: '🐺' },
		{ id: 'catppuccin', name: 'Catppuccin', icon: '🐈' },
		{ id: 'rose', name: 'Rose', icon: '🌷' },
		{ id: 'mona', name: 'Mona', icon: '🐙' },
		{ id: 'modern', name: 'Modern', icon: '🖥️' },
		{ id: 'crimson', name: 'Crimson', icon: '🩸' },
		{ id: 'nosh', name: 'Nosh', icon: '🍽️' },
		{ id: 'nouveau', name: 'Nouveau', icon: '🎨' },
		{ id: 'terminus', name: 'Terminus', icon: '🚉' }
	];

	// State for the currently active theme
	let currentTheme = $state('cerberus');
	let mode = $state<'light' | 'dark' | 'system'>('system');

	// Function to switch themes dynamically
	function setTheme(themeId: string) {
		currentTheme = themeId;
		// Update the data-theme attribute on the HTML tag
		document.documentElement.setAttribute('data-theme', themeId);
		localStorage.setItem('theme', themeId);
	}

	function applyMode(m: 'light' | 'dark') {
		if (m === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function applySystemMode() {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyMode(prefersDark ? 'dark' : 'light');
	}

	function setMode(newMode: 'light' | 'dark' | 'system') {
		mode = newMode;
		if (newMode === 'system') {
			localStorage.removeItem('mode');
			applySystemMode();
		} else {
			localStorage.setItem('mode', newMode);
			applyMode(newMode);
		}
	}

	onMount(() => {
		// Initialize Theme
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			setTheme(savedTheme);
		}

		// Initialize Mode
		const savedMode = localStorage.getItem('mode') as 'light' | 'dark' | null;
		if (savedMode) {
			mode = savedMode;
			applyMode(savedMode);
		} else {
			mode = 'system';
			applySystemMode();
		}

		// Listen for system changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			if (mode === 'system') {
				applyMode(e.matches ? 'dark' : 'light');
			}
		};
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	});

	let { children } = $props();

	const animation =
		'transition transition-discrete opacity-0 translate-y-[20px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[20px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';
</script>

<Dialog>
	<Dialog.Trigger>
		{@render children()}
	</Dialog.Trigger>

	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-950/50 backdrop-blur-sm" />

		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<Dialog.Content
				class="flex max-h-[85vh] w-full max-w-sm flex-col card bg-surface-100-900 p-6 shadow-xl {animation}"
			>
				<header class="mb-4 flex shrink-0 items-center justify-between">
					<Dialog.Title class="text-2xl font-bold">Themes</Dialog.Title>
					<Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
						<XIcon class="size-5" />
					</Dialog.CloseTrigger>
				</header>

				<div class="mb-4 flex w-full">
					<SegmentedControl
						defaultValue="start"
						value={mode}
						class="w-full"
						onValueChange={(details) => setMode(details.value as 'light' | 'dark' | 'system')}
					>
						<SegmentedControl.Control>
							<SegmentedControl.Indicator />
							<SegmentedControl.Item value="light" title="Light" aria-label="Light">
								<SegmentedControl.ItemText>
									<SunIcon class="size-4" />
								</SegmentedControl.ItemText>
								<SegmentedControl.ItemHiddenInput />
							</SegmentedControl.Item>
							<SegmentedControl.Item value="dark" title="Dark" aria-label="Dark">
								<SegmentedControl.ItemText>
									<MoonIcon class="size-4" />
								</SegmentedControl.ItemText>
								<SegmentedControl.ItemHiddenInput />
							</SegmentedControl.Item>
							<SegmentedControl.Item value="system" title="System" aria-label="System">
								<SegmentedControl.ItemText>
									<MonitorIcon class="size-4" />
								</SegmentedControl.ItemText>
								<SegmentedControl.ItemHiddenInput />
							</SegmentedControl.Item>
						</SegmentedControl.Control>
					</SegmentedControl>
				</div>

				<div class="space-y-2 overflow-y-auto pr-4">
					{#each themes as theme (theme.id)}
						<button
							type="button"
							class="flex w-full items-center justify-between p-3 transition-colors hover:bg-surface-200-800 rounded-xl"
							class:preset-tonal-primary={currentTheme === theme.id}
							onclick={() => setTheme(theme.id)}
						>
							<span class="flex items-center gap-3 text-lg">
								<span>{theme.icon}</span>
								<span>{theme.name}</span>
							</span>
						</button>
					{/each}
				</div>

				<footer class="mt-6 flex shrink-0 justify-end">
					<Dialog.CloseTrigger class="btn preset-filled">Done</Dialog.CloseTrigger>
				</footer>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog>
