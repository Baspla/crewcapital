<script lang="ts">
	import LoginButton from '$lib/components/auth/LoginButton.svelte';
	import { page } from '$app/state';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import { PaletteIcon } from '@lucide/svelte';
	import { toaster } from '$lib/toaster';
	import StockBackground from './StockBackground.svelte';

	const callbackURL = page.url.searchParams.get('redirectTo') || '/';
</script>

<StockBackground />

<div class="relative flex h-screen w-screen flex-col items-center justify-center gap-4">
	<h1 class="h1">Welcome to Crew Capital</h1>
	<LoginButton {callbackURL} />
</div>
<div class="absolute bottom-4 left-4">
	<ThemeSwitcher>
		<PaletteIcon class="size-5" />
	</ThemeSwitcher>
</div>
