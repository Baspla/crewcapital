<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="container mx-auto max-w-4xl p-8">
	<h1 class="mb-8 text-3xl font-bold">Dashboard</h1>

	<div class="rounded-lg border bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-semibold">Willkommen, {data.user.displayName || data.user.username}!</h2>

		<div class="space-y-3">
			<div class="flex gap-2">
				<span class="font-medium text-gray-600">Email:</span>
				<span>{data.user.email}</span>
			</div>

			<div class="flex gap-2">
				<span class="font-medium text-gray-600">Username:</span>
				<span>{data.user.username}</span>
			</div>

			<div class="flex gap-2">
				<span class="font-medium text-gray-600">User ID:</span>
				<span class="font-mono text-sm">{data.user.id}</span>
			</div>

			{#if data.user.groups.length > 0}
				<div class="flex gap-2">
					<span class="font-medium text-gray-600">Gruppen:</span>
					<div class="flex flex-wrap gap-1">
						{#each data.user.groups as group}
							<span class="rounded-full bg-blue-100 px-2 py-0.5 text-sm text-blue-800">
								{group}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
