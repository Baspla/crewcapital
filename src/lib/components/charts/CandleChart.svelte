<script lang="ts">
	import BaseChart, { formatCurrency } from './BaseChart.svelte';

	interface Props {
		data: {
			open: number | null;
			close: number | null;
			date: Date;
			id: string;
			assetId: string;
			high: number | null;
			low: number | null;
			volume: number | null;
		}[];
		title?: string;
		height?: string;
		currency?: { symbol: string; id: string };
	}

	let { data, title, height = '500px', currency }: Props = $props();

	let isDark = $state(false);

	let options = $derived.by(() => {
		// Sort data by date ascending so the chart goes from left (old) to right (new)
		const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const titleOptions = title
			? {
					text: title,
					left: 'center',
					textStyle: {
						color: isDark ? '#f3f4f6' : '#1f2937'
					}
				}
			: undefined;

		const options : echarts.EChartsOption = {
			backgroundColor: 'transparent',
			title: titleOptions,
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'cross' },
				formatter: (params: any) => {
					const param = Array.isArray(params) ? params[0] : params;
					if (!param || !param.data) return '';
					// data format: [date, open, close, low, high]
					const [date, open, close, low, high] = param.data;
					const dateStr = date instanceof Date 
						? date.toLocaleString() 
						: new Date(date).toLocaleString();

					return `
						${dateStr}<br/>
						${param.marker} Open: <b>${formatCurrency(open, currency)}</b><br/>
						${param.marker} Close: <b>${formatCurrency(close, currency)}</b><br/>
						${param.marker} Low: <b>${formatCurrency(low, currency)}</b><br/>
						${param.marker} High: <b>${formatCurrency(high, currency)}</b>
					`;
				}
			},
			grid: { left: '10%', right: '10%', bottom: '15%' },
			xAxis: {
				type: 'time',
				axisLabel: { color: isDark ? '#9ca3af' : '#4b5563' }
			},
			yAxis: {
				scale: true,
				axisLabel: {
					color: isDark ? '#9ca3af' : '#4b5563',
					formatter: (value: number) => formatCurrency(value, currency)
				},
				splitLine: { lineStyle: { color: isDark ? '#374151' : '#e5e7eb' } }
			},
			dataZoom: [{ type: 'inside', start: 50, end: 100 }, { type: 'slider' }],
			series: [
				{
					type: 'candlestick',
					data: sortedData.map((item) => [item.date, item.open, item.close, item.low, item.high]),
					itemStyle: {
						color: '#26a69a', // Bullish color (Green)
						color0: '#ef5350', // Bearish color (Red)
						borderColor: '#26a69a',
						borderColor0: '#ef5350'
					}
				}
			]
		};
		return options;
	});
</script>

<BaseChart {options} {height} bind:isDark />
