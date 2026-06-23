import { buildSavingsReport } from '$lib/domain/savings-estimate';
import type { ConsumptionEventType } from '$lib/infrastructure/repositories/consumption.repository';

export interface WastePreventedSnapshot {
	hasData: boolean;
	preventedSek: number;
	consumedCount: number;
	monthLabel: string;
}

export function startOfCalendarMonth(reference = new Date()): Date {
	return new Date(reference.getFullYear(), reference.getMonth(), 1);
}

export function buildWastePreventedSnapshot(
	events: Array<{ productName: string; eventType: ConsumptionEventType }>,
	locale: string,
	reference = new Date()
): WastePreventedSnapshot {
	const report = buildSavingsReport(events);
	const monthLabel = reference.toLocaleDateString(locale === 'en' ? 'en-GB' : 'sv-SE', {
		month: 'long'
	});

	return {
		hasData: report.hasData,
		preventedSek: report.savedSek,
		consumedCount: report.consumedCount,
		monthLabel
	};
}
