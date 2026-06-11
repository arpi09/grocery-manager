import type { LastPaidPrice } from './price-memory';

export function formatPriceMemoryAmount(amount: string, currency: string): string {
	const numeric = Number(amount);
	if (!Number.isFinite(numeric)) {
		return `${amount} ${currency}`.trim();
	}
	return new Intl.NumberFormat('sv-SE', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(numeric);
}

export function formatPriceMemoryMonthYear(date: Date, locale = 'sv-SE'): string {
	return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date);
}

export function buildPriceMemoryContext(
	lastPaidPrice: LastPaidPrice,
	locale = 'sv-SE'
): {
	formattedUnitPrice: string;
	formattedLineTotal: string | null;
	monthYear: string;
	storeLabel: string | null;
} {
	return {
		formattedUnitPrice: formatPriceMemoryAmount(lastPaidPrice.unitPrice, lastPaidPrice.currency),
		formattedLineTotal: lastPaidPrice.lineTotal
			? formatPriceMemoryAmount(lastPaidPrice.lineTotal, lastPaidPrice.currency)
			: null,
		monthYear: formatPriceMemoryMonthYear(lastPaidPrice.purchasedAt, locale),
		storeLabel: lastPaidPrice.storeLabel
	};
}
