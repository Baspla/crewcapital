<script lang="ts">
	import BaseChart, { formatCurrency } from './BaseChart.svelte';

	interface Props {
		data: {
			open: number | null;
			close: number;
			date: Date;
			id: string;
			assetId: string;
			high: number | null;
			low: number | null;
			volume: number | null;
		}[];
		title?: string;
		height?: string;
		width?: string;
		color?: string;
		currency?: { symbol: string; id: string };
	}

	let {
		data,
		height = '200px',
		width = '300px',
		currency
	}: Props = $props();

	let isDark = $state(false);

	const options = $derived.by(() => {
		const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const startPrice = sortedData[0]?.close ?? 0;
		const endPrice = sortedData[sortedData.length - 1]?.close ?? 0;
		const chartColor = endPrice >= startPrice ? '#22c55e' : '#ef4444';

		const prices = sortedData.map((d) => d.close);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const priceRange = maxPrice - minPrice;

		const options: echarts.EChartsOption = {
			backgroundColor: 'transparent',
			tooltip: {
				trigger: 'axis',
				formatter: (params: any) => {
					const item = Array.isArray(params) ? params[0] : params;
					const formattedValue = formatCurrency(item.data as number, currency);
					return `${item.axisValue}<br/><span style="font-weight:bold">${formattedValue}</span>`;
				}
			},
			grid: { left: '0%', right: '1%', bottom: '0%', top: '0%' },
			xAxis: {
				type: 'category',
				data: sortedData.map((item) => item.date.toISOString().split('T')[0]),
				show: false
			},
			yAxis: {
				type: 'value',
				min: minPrice,
				max: maxPrice,
				interval: priceRange ,
				show: true,
				axisLine: { show: false },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: {
					show: true,
					inside: false,
					color: isDark ? '#9ca3af' : '#4b5563',
					margin: 2,
					formatter: (value: number) => formatCurrency(value, currency)
				}
			},
			series: [
				{
					data: sortedData.map((item) => item.close),
					type: 'line',
					smooth: true,
					symbol: 'none',
					lineStyle: {
						width: 2,
						color: chartColor
					},
					itemStyle: {
						color: chartColor
					},
					areaStyle: {
						color: {
							type: 'linear',
							x: 0,
							y: 0,
							x2: 0,
							y2: 1,
							colorStops: [
								{ offset: 0, color: chartColor },
								{ offset: 1, color: 'transparent' }
							],
							global: false
						},
						opacity: 0.2
					}
				}
			]
		};
        return options;
	});
</script>

<BaseChart {options} {height} {width} bind:isDark />
