import { describe, expect, it } from 'vitest';
import { buildActivationFunnelSnapshot } from './activation-funnel';

describe('buildActivationFunnelSnapshot', () => {
	it('computes cohort conversion rates', () => {
		const periodStart = new Date('2026-06-01T00:00:00.000Z');
		const periodEnd = new Date('2026-06-08T00:00:00.000Z');

		const snapshot = buildActivationFunnelSnapshot({
			periodDays: 7,
			periodStart,
			periodEnd,
			cohortUsers: [
				{ userId: 'u1', registeredAt: periodStart, lastSeenAt: periodEnd },
				{ userId: 'u2', registeredAt: periodStart, lastSeenAt: null }
			],
			onboardingStartedUserIds: new Set(['u1', 'u2']),
			receiptParsed24hUserIds: new Set(['u1']),
			inventoryFivePlus24hUserIds: new Set(['u1']),
			activationRecipesShownUserIds: new Set(['u1']),
			d7Retained: 1,
			d7Eligible: 2,
			sharedListOpened: 3
		});

		expect(snapshot.counts.registrations).toBe(2);
		expect(snapshot.rates.onboardingFromSignup).toBe(1);
		expect(snapshot.rates.receiptParsedFromSignup).toBe(0.5);
		expect(snapshot.rates.recipesFromReceiptUsers).toBe(1);
		expect(snapshot.counts.sharedListOpened).toBe(3);
	});
});
