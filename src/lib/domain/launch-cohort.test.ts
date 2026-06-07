import { describe, expect, it } from 'vitest';
import {
	buildLaunchCohortSnapshot,
	LAUNCH_COHORT_UNKNOWN_CAMPAIGN,
	parseUtmCampaignFromMetadata,
	startOfWeekUtc
} from './launch-cohort';

describe('launch cohort domain', () => {
	it('extracts utm_campaign from signup_complete metadata', () => {
		expect(
			parseUtmCampaignFromMetadata(JSON.stringify({ utm_campaign: 'matsvinn_w12' }))
		).toBe('matsvinn_w12');
		expect(parseUtmCampaignFromMetadata(JSON.stringify({ variant: 'a' }))).toBeNull();
	});

	it('groups signups by UTC week and campaign', () => {
		const snapshot = buildLaunchCohortSnapshot({
			periodDays: 30,
			periodStart: new Date('2026-05-11T12:00:00.000Z'),
			periodEnd: new Date('2026-06-10T12:00:00.000Z'),
			events: [
				{
					createdAt: new Date('2026-06-02T10:00:00Z'),
					metadata: JSON.stringify({ utm_campaign: 'matsvinn_w12' })
				},
				{
					createdAt: new Date('2026-06-03T11:00:00Z'),
					metadata: JSON.stringify({ utm_campaign: 'matsvinn_w12' })
				},
				{
					createdAt: new Date('2026-06-09T09:00:00Z'),
					metadata: JSON.stringify({ utm_campaign: 'zerowaste_w2' })
				},
				{
					createdAt: new Date('2026-06-08T10:00:00Z'),
					metadata: JSON.stringify({ variant: 'a' })
				}
			]
		});

		expect(snapshot.totalSignups).toBe(4);
		expect(snapshot.rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					weekStart: startOfWeekUtc(new Date('2026-06-02T10:00:00Z')),
					utmCampaign: 'matsvinn_w12',
					signups: 2
				}),
				expect.objectContaining({
					weekStart: startOfWeekUtc(new Date('2026-06-09T09:00:00Z')),
					utmCampaign: 'zerowaste_w2',
					signups: 1
				}),
				expect.objectContaining({
					utmCampaign: LAUNCH_COHORT_UNKNOWN_CAMPAIGN,
					signups: 1
				})
			])
		);
	});
});
