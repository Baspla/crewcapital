<script lang="ts">
	import Container from '$lib/components/layout/Container.svelte';
	import ToDoList from '$lib/components/ToDoList.svelte';
	import WorkInProgress from '$lib/components/WorkInProgress.svelte';

	let { data } = $props();
	const items = [
		{ id: 1, text: 'Create re-usable components', completed: false },
		{ id: 2, text: 'Adding Currency Conversions (static/real)', completed: false },
		{ id: 3, text: 'Adding Currencies', completed: false },
		{ id: 4, text: 'Performing Currency Conversions', completed: false },
		{ id: 5, text: 'Ensuring re-usable views shared between user & admin pages', completed: false },
		{
			id: 6,
			text: 'Proper rules for who & when prediction markets can be resolved',
			completed: false
		},
		{ id: 7, text: 'Buying and Selling of Prediction Market Shares', completed: false },
		{
			id: 8,
			text: 'Ensuring selected portfolio is used everywhere not first indexed',
			completed: false
		},
		{ id: 9, text: 'Add User Profile Page', completed: false },
		{ id: 10, text: 'Add User Portfolio Page', completed: false }
	];
</script>

<Container>
	<h1 class="mb-6 text-3xl font-bold">Crew Capital</h1>
	<div>
		<p>Hallo, {data.user.name}</p>
	</div>
	<WorkInProgress />
	<ToDoList {items} />
</Container>
