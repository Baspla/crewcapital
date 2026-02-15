<script lang="ts">
	import { page } from '$app/state';
	import Container from '$lib/components/layout/Container.svelte';
</script>

<Container>	
	<h1 class="text-2xl font-bold mb-4">Admin Dashboard</h1>
	<p>Welcome, {page.data.user?.name}!</p>
	<p>You have access to this protected admin area.</p>
</Container>
