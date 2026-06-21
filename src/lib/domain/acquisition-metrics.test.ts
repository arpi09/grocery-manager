import { describe, expect, it } from 'vitest';
import {
	buildAcquisitionMetricsSnapshot,
	emptyAcquisitionEventCounts
} from './acquisition-metrics';

describe('buildAcquisitionMetricsSnapshot', () => {
	const periodStart = new Date('2026-06-14T00:00:00.000Z');
	const periodEnd = new Date('2026-06-21T00:00:00.000Z');

	it('computes shared list signup conversion and CTR', () => {
		const snapshot = buildAcquisitionMetricsSnapshot(
			{
				...emptyAcquisitionEventCounts(),
				shared_list_opened: 100,
				shared_list_signup_completed: 5,
				shared_list_signup_clicked: 12
			},
			periodStart,
			periodEnd
		);

		expect(snapshot.sharedListSignupConversion).toBe(0.05);
		expect(snapshot.sharedListSignupCtr).toBe(0.12);
	});

	it('computes public surface signup CTR', () => {
		const snapshot = buildAcquisitionMetricsSnapshot(
			{
				...emptyAcquisitionEventCounts(),
				public_surface_viewed: 40,
				public_surface_signup_clicked: 4
			},
			periodStart,
			periodEnd
		);

		expect(snapshot.publicSurfaceSignupCtr).toBe(0.1);
	});

	it('returns null rates when denominators are zero', () => {
		const snapshot = buildAcquisitionMetricsSnapshot(
			emptyAcquisitionEventCounts(),
			periodStart,
			periodEnd
		);

		expect(snapshot.sharedListSignupConversion).toBeNull();
		expect(snapshot.sharedListSignupCtr).toBeNull();
		expect(snapshot.publicSurfaceSignupCtr).toBeNull();
	});
});
