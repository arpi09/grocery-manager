import { describe, expect, it } from 'vitest';
import {
	buildPmfDigestEmailContent,
	formatDeltaSv,
	formatMetricValueSv,
	getRecommendedActionText,
	pickRecommendedMetric
} from './pmf-digest';
import {
	buildMetricStatus,
	buildWeeklyReview,
	type PmfMetricSnapshot
} from './pmf';

function emptySnapshot(overrides: Partial<PmfMetricSnapshot> = {}): PmfMetricSnapshot {
	return {
		activationRate: 0,
		activatedUsers: 0,
		eligibleUsers: 0,
		medianTimeToFirstScanMinutes: null,
		weeklyScanRate: 0,
		wauCount: 0,
		weeklyScanners: 0,
		d7Retention: 0,
		d7EligibleUsers: 0,
		d30Retention: 0,
		d30EligibleUsers: 0,
		multiMemberHouseholdRate: 0,
		activeHouseholds: 0,
		multiMemberActiveHouseholds: 0,
		smartFillWeeklyRate: 0,
		weeklyFillUsers: 0,
		eventCounts: {
			scan_completed: 0,
			receipt_parsed: 0,
			photo_round_parsed: 0,
			fill_suggestions_added: 0
		},
		...overrides
	};
}

describe('pickRecommendedMetric', () => {
	it('picks first below-target metric in PMF priority order', () => {
		const current = emptySnapshot({
			activationRate: 0.1,
			activatedUsers: 1,
			eligibleUsers: 10,
			weeklyScanRate: 0.1,
			wauCount: 10,
			weeklyScanners: 1,
			medianTimeToFirstScanMinutes: 2
		});
		const previous = emptySnapshot();
		const review = buildWeeklyReview(
			current,
			previous,
			new Date('2026-06-01T08:00:00Z'),
			new Date('2026-05-25T08:00:00Z')
		);

		const picked = pickRecommendedMetric(review.belowTarget);
		expect(picked?.key).toBe('activationRate');
	});

	it('returns null when all metrics are on target', () => {
		const current = emptySnapshot({
			activationRate: 0.5,
			medianTimeToFirstScanMinutes: 2,
			weeklyScanRate: 0.4,
			wauCount: 10,
			weeklyScanners: 4,
			d7Retention: 0.25,
			d7EligibleUsers: 4,
			d30Retention: 0.2,
			d30EligibleUsers: 4,
			multiMemberHouseholdRate: 0.6,
			activeHouseholds: 5,
			multiMemberActiveHouseholds: 3,
			smartFillWeeklyRate: 0.25,
			weeklyFillUsers: 2
		});
		const review = buildWeeklyReview(
			current,
			current,
			new Date('2026-06-01T08:00:00Z'),
			new Date('2026-05-25T08:00:00Z')
		);

		expect(pickRecommendedMetric(review.belowTarget)).toBeNull();
		expect(getRecommendedActionText(null)).toContain('Alla spårade mätetal');
	});
});

describe('formatDeltaSv', () => {
	it('formats rate delta as percentage points', () => {
		const status = buildMetricStatus(
			'activationRate',
			emptySnapshot({ activationRate: 0.1 }),
			emptySnapshot({ activationRate: 0.05 })
		);
		expect(formatDeltaSv(status)).toBe('+5 pp');
	});

	it('formats flat delta', () => {
		const status = buildMetricStatus(
			'activationRate',
			emptySnapshot({ activationRate: 0.1 }),
			emptySnapshot({ activationRate: 0.1005 })
		);
		expect(formatDeltaSv(status)).toBe('oförändrat');
	});
});

describe('buildPmfDigestEmailContent', () => {
	it('includes metrics, health stats, action and admin link in Swedish', () => {
		const current = emptySnapshot({
			activationRate: 0.034,
			activatedUsers: 1,
			eligibleUsers: 29,
			wauCount: 28,
			weeklyScanners: 1,
			weeklyScanRate: 0.036,
			eventCounts: {
				scan_completed: 0,
				receipt_parsed: 7,
				photo_round_parsed: 0,
				fill_suggestions_added: 2
			}
		});
		const review = buildWeeklyReview(
			current,
			emptySnapshot(),
			new Date('2026-06-01T08:00:00Z'),
			new Date('2026-05-25T08:00:00Z')
		);

		const content = buildPmfDigestEmailContent({
			review,
			stats: {
				userCount: 29,
				householdCount: 29,
				membershipCount: 29,
				inventoryCount: 6,
				shoppingListItemCount: 0,
				errorCount7Days: 83,
				errorCountTotal: 100,
				activeNowCount: 1,
				activeSessionCount: 1,
				lastActivityAt: null,
				databaseBackend: 'postgres'
			},
			waitlistCount: 0,
			adminUrl: 'https://skaffu.com/admin'
		});

		expect(content.subject).toContain('PMF');
		expect(content.subject).toContain('0/7');
		expect(content.recommendedMetric).toBe('activationRate');
		expect(content.text).toContain('Aktivering (24 h)');
		expect(content.text).toContain('Pro-waitlist: 0 / 50');
		expect(content.text).toContain('Prioritera onboarding-friktion');
		expect(content.text).toContain('https://skaffu.com/admin');
		expect(content.html).toContain('https://skaffu.com/admin');
		expect(formatMetricValueSv('activationRate', 0.034)).toBe('3,4\u00a0%');
	});
});
