import { formatNormalizedKeyForDisplay } from '$lib/domain/learning/display-key';
import type { StorageLocation } from '$lib/domain/location';
import { locationLabel } from '$lib/i18n/domain-labels';
import type { Locale } from '$lib/i18n/locale';
import { DEFAULT_LOCALE } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';

export type BrainTimelineKind = 'shelf_life_learned' | 'location_learned' | 'receipt_autopilot' | 'receipt_import';

export interface BrainTimelineEntry {
	id: string;
	kind: BrainTimelineKind;
	occurredAt: string;
	messageKey: string;
	messageParams: Record<string, string | number>;
}

export interface BrainTimelineShelfLifeRuleInput {
	normalizedKey: string;
	location: StorageLocation;
	typicalDays: number;
	sampleCount: number;
	updatedAt: Date;
}

export interface BrainTimelineLocationRuleInput {
	normalizedKey: string;
	location: StorageLocation;
	sampleCount: number;
	updatedAt: Date;
}

export interface BrainTimelineEventInput {
	id: string;
	eventType: string;
	createdAt: Date;
	metadata?: Record<string, unknown> | null;
}

function relativeDayKey(date: Date, reference = new Date()): string {
	const start = new Date(reference);
	start.setHours(0, 0, 0, 0);
	const target = new Date(date);
	target.setHours(0, 0, 0, 0);
	const diffDays = Math.round((start.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'today';
	if (diffDays === 1) return 'yesterday';
	return 'earlier';
}

export function buildBrainTimelineEntries(input: {
	shelfLifeRules: BrainTimelineShelfLifeRuleInput[];
	locationRules: BrainTimelineLocationRuleInput[];
	events: BrainTimelineEventInput[];
	limit?: number;
	referenceDate?: Date;
}): BrainTimelineEntry[] {
	const limit = input.limit ?? 5;
	const referenceDate = input.referenceDate ?? new Date();
	const entries: BrainTimelineEntry[] = [];

	for (const rule of input.shelfLifeRules) {
		if (rule.sampleCount < 2) continue;
		entries.push({
			id: `shelf:${rule.normalizedKey}:${rule.location}`,
			kind: 'shelf_life_learned',
			occurredAt: rule.updatedAt.toISOString(),
			messageKey: 'brain.timeline.shelfLifeLearned',
			messageParams: {
				product: formatNormalizedKeyForDisplay(rule.normalizedKey),
				days: rule.typicalDays,
				when: relativeDayKey(rule.updatedAt, referenceDate)
			}
		});
	}

	for (const rule of input.locationRules) {
		if (rule.sampleCount < 2) continue;
		entries.push({
			id: `loc:${rule.normalizedKey}`,
			kind: 'location_learned',
			occurredAt: rule.updatedAt.toISOString(),
			messageKey: 'brain.timeline.locationLearned',
			messageParams: {
				product: formatNormalizedKeyForDisplay(rule.normalizedKey),
				location: rule.location,
				when: relativeDayKey(rule.updatedAt, referenceDate)
			}
		});
	}

	for (const event of input.events) {
		if (event.eventType === 'receipt_autopilot_accepted') {
			const name =
				typeof event.metadata?.name === 'string'
					? event.metadata.name
					: typeof event.metadata?.normalizedKey === 'string'
						? formatNormalizedKeyForDisplay(event.metadata.normalizedKey)
						: translate(DEFAULT_LOCALE, 'learning.explain.productFallback');
			entries.push({
				id: event.id,
				kind: 'receipt_autopilot',
				occurredAt: event.createdAt.toISOString(),
				messageKey: 'brain.timeline.receiptAutopilot',
				messageParams: {
					product: name,
					when: relativeDayKey(event.createdAt, referenceDate)
				}
			});
		}

		if (event.eventType === 'receipt_parsed' || event.eventType === 'kivra_forward_received') {
			const lineCount =
				typeof event.metadata?.lineCount === 'number'
					? event.metadata.lineCount
					: typeof event.metadata?.itemsAdded === 'number'
						? event.metadata.itemsAdded
						: null;
			if (lineCount == null || lineCount <= 0) continue;
			entries.push({
				id: event.id,
				kind: 'receipt_import',
				occurredAt: event.createdAt.toISOString(),
				messageKey: 'brain.timeline.receiptImport',
				messageParams: {
					count: lineCount,
					when: relativeDayKey(event.createdAt, referenceDate)
				}
			});
		}
	}

	return entries
		.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
		.slice(0, limit);
}

export function formatBrainTimelineEntry(
	entry: BrainTimelineEntry,
	locale: Locale = DEFAULT_LOCALE
): string {
	const params = { ...entry.messageParams };
	if (typeof params.location === 'string') {
		params.location = locationLabel(locale, params.location as StorageLocation);
	}
	if (typeof params.when === 'string') {
		params.whenLabel = translate(
			locale,
			`brain.timeline.when.${params.when}` as 'brain.timeline.when.today'
		);
	}
	return translate(locale, entry.messageKey as 'brain.timeline.shelfLifeLearned', params);
}
