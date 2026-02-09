<script lang='ts'>
import './layout.css';
import favicon from '$lib/assets/favicon.png';
	import Toaster from '$lib/components/Toaster.svelte';
let { children } = $props();
</script>

<svelte:head>
<link rel='icon' href={favicon} />
<title>Gnag Exchange</title>
</svelte:head>

<Toaster>
{@render children()}
</Toaster>