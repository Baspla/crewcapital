<script lang="ts">
	import { page } from '$app/state';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import { PaletteIcon } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Crew Capital - Error {page.status}</title>
</svelte:head>

<div class="container flex h-screen w-screen flex-col items-center justify-center space-y-4">
	<span class="text-6xl">🫠</span>
	<h1 class="text-2xl font-bold">Error {page.status}</h1>
	<p>{page.error?.message}</p>
</div>
<div class="absolute bottom-4 left-4">
	<ThemeSwitcher>
		<PaletteIcon class="size-5" />
	</ThemeSwitcher>
</div>
