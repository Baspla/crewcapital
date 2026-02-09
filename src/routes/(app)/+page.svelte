<script lang="ts">
	import { toaster } from '$lib/toaster.js';

	let { data } = $props();
</script>

<div>
	<div>
		<p>Name: {data.user.name}</p>
		<p>ID: {data.user.id}</p>
		<p>Email: {data.user.email}</p>
		<p>Created At: {data.user.createdAt.toLocaleString()}</p>
		<p>Updated At: {data.user.updatedAt.toLocaleString()}</p>
		<p>Groups: {data.user.groups}</p>
	</div>
	<button
		class="btn preset-filled-primary-500"
		onclick={() => {
			toaster.info({
				title: 'Pong!',
				description: 'This is a test notification to verify that the server is responsive.'+Math.random()
			});
		}}
	>
		Ping
	</button>
</div>
