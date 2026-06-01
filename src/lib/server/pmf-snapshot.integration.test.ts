/**
 * Read-only PMF + admin stats snapshot (uses .env DATABASE_URL).
 * Usage: node --env-file=.env node_modules/vitest/vitest.mjs run --config vitest.integration.config.ts scripts/pmf-snapshot.integration.test.ts
 */
import { beforeAll, describe, it } from 'vitest';
import { initDatabase } from '$lib/infrastructure/db';
import { pmfService, waitlistService, adminService } from '$lib/server/di';

describe('pmf snapshot (manual)', () => {
	beforeAll(async () => {
		await initDatabase();
	});

	it.skipIf(!process.env.DATABASE_URL)('prints prod PMF metrics', async () => {
		const review = await pmfService.getWeeklyReview();
		const stats = await adminService.getDashboardStats();
		const waitlist = await waitlistService.count();

		console.log(
			JSON.stringify(
				{
					capturedAt: new Date().toISOString(),
					stats: {
						userCount: stats.userCount,
						householdCount: stats.householdCount,
						inventoryCount: stats.inventoryCount,
						activeNowCount: stats.activeNowCount,
						errorCount7Days: stats.errorCount7Days
					},
					waitlist,
					current: review.current,
					metrics: review.metrics.map((m) => ({
						key: m.key,
						current: m.current,
						previous: m.previous,
						delta: m.delta,
						deltaDirection: m.deltaDirection,
						onTarget: m.onTarget,
						target: m.target
					})),
					onTargetCount: review.onTargetCount,
					totalTracked: review.totalTracked
				},
				null,
				2
			)
		);
	});
});
