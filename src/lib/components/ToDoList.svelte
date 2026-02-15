<script lang="ts">
    const {items} = $props()
</script>

<div >
    <h2 class="mb-4 text-xl font-bold">To-Do List</h2>
    <ul>
        {#each items as item}
            <li class="flex items-center mb-2">
                <input type="checkbox" class="mr-2" bind:checked={item.completed} disabled />
                <span class:line-through={item.completed}>{item.text}</span>
            </li>
        {/each}
    </ul>
</div>