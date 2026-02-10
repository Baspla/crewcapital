<script lang="ts">
	import { onMount } from 'svelte';
	import { draw, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	type StockLine = {
		id: number;
		d: string;
		color: string;
		strokeWidth: number;
	};

	let lines = $state<StockLine[]>([]);
	let width = $state(1000);
	let height = $state(800);
	let nextId = 0;

	// Config
	const LINE_LIFETIME = 15000; // Slower: Stay on screen much longer
	const SPAWN_INTERVAL = 3500; // Fewer: Spawn less frequently

	function generateLine() {
		if (width === 0 || height === 0) return;

		// 1. Determine Start Position & Trend to ensure variety
		// 50% Left Edge, 25% Top, 25% Bottom
		const startMode = Math.random();
		
		let startX = 0; 
		let startY = 0;
		let isGreen = false;

		if (startMode < 0.5) {
			// Start Left
			startX = -20;
			isGreen = Math.random() > 0.5;
			// If going Up (Green), start lower. If Down (Red), start higher.
			// Steep lines need more vertical room.
			startY = isGreen 
				? (height * 0.6) + (Math.random() * height * 0.4) 
				: (Math.random() * height * 0.4);
		} else if (startMode < 0.75) {
			// Start Top
			startX = Math.random() * (width * 0.5); // Start in left half
			startY = -20;
			isGreen = false; // Must go down (Red)
		} else {
			// Start Bottom
			startX = Math.random() * (width * 0.5); // Start in left half
			startY = height + 20;
			isGreen = true; // Must go up (Green)
		}

		const color = isGreen ? '#22c55e' : '#ef4444'; 
		
		let d = `M ${startX} ${startY}`;
		let currentX = startX;
		let currentY = startY;
		
		// Continue until off screen (Right, Top, or Bottom)
		// Added Y bounds check so we don't draw invisible segments forever if it goes steep off-screen
		while (currentX < width + 20 && currentY > -200 && currentY < height + 200) {
			const stepX = (Math.random() * 20) + 5; 
			currentX += stepX;
			
			const volatility = 100; 
			const spike = (Math.random() * volatility) - (volatility / 2);
			
			const trendStep = (Math.random() * 15) + 5; 

			if (isGreen) {
				currentY -= trendStep;
				currentY += spike;
			} else {
				currentY += trendStep;
				currentY += spike;
			}
			
			d += ` L ${currentX} ${currentY}`;
		}

		const newLine: StockLine = {
			id: nextId++,
			d,
			color,
			strokeWidth: Math.random() * 3 + 2 
		};

		lines.push(newLine);

		// Remove the line later
		setTimeout(() => {
			lines = lines.filter(l => l.id !== newLine.id);
		}, LINE_LIFETIME);
	}

	onMount(() => {
		const interval = setInterval(generateLine, SPAWN_INTERVAL);
		
		// Initial batch - reduced start burst
		generateLine();
		generateLine();

		return () => clearInterval(interval);
	});
</script>

<div class="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-zinc-50 dark:bg-zinc-950"
	bind:clientWidth={width}
	bind:clientHeight={height}
	aria-hidden="true"
>
	<svg 
		{width} 
		{height} 
		class="w-full h-full blur-sm "
		viewBox="0 0 {width} {height}"
	>
		{#each lines as line (line.id)}
			<path
				d={line.d}
				stroke={line.color}
				stroke-width={line.strokeWidth}
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				in:draw={{ duration: 8000, easing: cubicOut }}
				out:fade={{ duration: 3000 }}
			/>
		{/each}
	</svg>
</div>
