<script lang="ts">
  import WorkInProgress from '$lib/components/WorkInProgress.svelte';
	import CandleChart from '$lib/components/charts/CandleChart.svelte';

  let { form } = $props();
</script>

<div class="container mx-auto p-4">
  <h1 class="mb-4 text-2xl font-bold inline-flex items-center ">
    Testing
    <WorkInProgress class="size-10" />
  </h1>
</div>

