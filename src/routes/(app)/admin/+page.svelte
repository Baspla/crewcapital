<script lang="ts">
	import { page } from '$app/state';
	import Container from '$lib/components/layout/Container.svelte';
</script>

<Container>
	<h1 class="text-2xl font-bold mb-4">Admin Dashboard</h1>
    <a href="/admin/testing" class="px-4 py-2 preset-filled transition rounded-base">
        Go to Testing Page
    </a>
</Container>
