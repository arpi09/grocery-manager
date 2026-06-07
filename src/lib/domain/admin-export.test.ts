import { describe, expect, it } from 'vitest';
import {
	buildAdminDataExportCsv,
	buildAdminExportFilename,
	parseAdminExportPeriodDays
} from '$lib/domain/admin-export';
import type { PmfWeeklyReview } from '$lib/domain/pmf';

const exportedAt = new Date('2026-06-07T10:00:00.000Z');

function makeReview(): PmfWeeklyReview {
	return {
		currentWeekEnd: new Date('2026-06-07T23:59:59.000Z'),
		previousWeekEnd: new Date('2026-05-31T23:59:59.000Z'),
		current: {
			activationRate: 0.5,
			activatedUsers: 5,
			eligibleUsers: 10,
			medianTimeToFirstScanMinutes: 2,
			weeklyScanRate: 0.4,
			wauCount: 8,
			weeklyScanners: 3,
			d7Retention: 0.25,
			d7EligibleUsers: 4,
			d30Retention: 0.2,
			d30EligibleUsers: 2,
			multiMemberHouseholdRate: 0.6,
			activeHouseholds: 5,
			multiMemberActiveHouseholds: 3,
			smartFillWeeklyRate: 0.1,
			weeklyFillUsers: 1,
			weeklyRitualRate: 0.2,
			weeklyRitualUsers: 2,
			wrappedRate: 0.25,
			mauCount: 8,
			wrappedViewers: 2,
			receiptRate: 0.3,
			receiptUsers: 2,
			inviteRate: 0.4,
			newHouseholds: 5,
			multiMemberNewHouseholds: 2,
			eventCounts: {
				scan_completed: 12,
				receipt_parsed: 3,
				photo_round_parsed: 1,
				fill_suggestions_added: 2
			}
		},
		previous: {
			activationRate: 0.4,
			activatedUsers: 4,
			eligibleUsers: 10,
			medianTimeToFirstScanMinutes: 3,
			weeklyScanRate: 0.3,
			wauCount: 7,
			weeklyScanners: 2,
			d7Retention: 0.2,
			d7EligibleUsers: 4,
			d30Retention: 0.15,
			d30EligibleUsers: 2,
			multiMemberHouseholdRate: 0.5,
			activeHouseholds: 4,
			multiMemberActiveHouseholds: 2,
			smartFillWeeklyRate: 0.05,
			weeklyFillUsers: 0,
			weeklyRitualRate: 0.1,
			weeklyRitualUsers: 1,
			wrappedRate: 0.15,
			mauCount: 7,
			wrappedViewers: 1,
			receiptRate: 0.2,
			receiptUsers: 1,
			inviteRate: 0.25,
			newHouseholds: 4,
			multiMemberNewHouseholds: 1,
			eventCounts: {
				scan_completed: 8,
				receipt_parsed: 1,
				photo_round_parsed: 0,
				fill_suggestions_added: 0
			}
		},
		metrics: [
			{
				key: 'activationRate',
				current: 0.5,
				previous: 0.4,
				delta: 0.1,
				deltaDirection: 'up',
				onTarget: true,
				target: 0.4,
				higherIsBetter: true
			}
		],
		belowTarget: [],
		onTargetCount: 1,
		totalTracked: 1
	};
}

describe('admin export', () => {
	it('defaults export period to 30 days', () => {
		expect(parseAdminExportPeriodDays(null)).toBe(30);
		expect(parseAdminExportPeriodDays('30')).toBe(30);
		expect(parseAdminExportPeriodDays('7')).toBe(7);
		expect(parseAdminExportPeriodDays('14')).toBe(7);
	});

	it('builds CSV with PMF snapshot, events, and routes', () => {
		const csv = buildAdminDataExportCsv({
			exportedAt,
			periodDays: 30,
			pmfWeeklyReview: makeReview(),
			events: [
				{ day: '2026-06-06', eventType: 'scan_completed', count: 4 },
				{ day: '2026-06-05', eventType: 'receipt_parsed', count: 1 }
			],
			routes: [{ route: '/hem', viewCount: 42, uniqueSessions: 10, avgDurationMs: 55_000 }]
		});

		expect(csv).toContain('section,pmf_snapshot');
		expect(csv).toContain('metric_key,current,previous,target,on_target,delta,delta_direction');
		expect(csv).toContain('activationRate,0.5,0.4,0.4,true,0.1,up');
		expect(csv).toContain('eligible_users,10');
		expect(csv).toContain('section,events_per_day');
		expect(csv).toContain('2026-06-06,scan_completed,4');
		expect(csv).toContain('section,top_routes');
		expect(csv).toContain('/hem,42,10,55000');
	});

	it('builds a dated export filename', () => {
		expect(buildAdminExportFilename(30, exportedAt)).toBe('skaffu-admin-export-2026-06-07-30d.csv');
	});
});
