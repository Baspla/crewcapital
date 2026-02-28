export function formatCurrency(value: number | null | undefined, currency?: { symbol: string; id: string }) {
		if (value === null || value === undefined) return '';
		if (!currency) return value?.toLocaleString('de-DE') ?? '';

		const formattedNumber = value?.toLocaleString('de-DE', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});

		if (['USD', 'GBP'].includes(currency.id)) {
			return `${currency.symbol}${formattedNumber}`;
		}

		return `${formattedNumber} ${currency.symbol}`;
	}