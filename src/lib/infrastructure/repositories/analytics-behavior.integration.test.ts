import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsBehaviorService } from '$lib/application/analytics-behavior.service';
import type { AppDatabase } from '$lib/infrastructure/db';
import { DrizzleAnalyticsBehaviorRepository } from '$lib/infrastructure/repositories/analytics-behavior.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

const { dbState } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null }
}));

vi.mock('$lib/infrastructure/db', () => ({
	db: new Proxy({} as AppDatabase, {
		get(_target, prop) {
			if (!dbState.db) {
				throw new Error('Integration db not initialized');
			}
			return Reflect.get(dbState.db, prop);
		}
	}),
	getDb: () => {
		if (!dbState.db) {
			throw new Error('Integration db not initialized');
		}
		return dbState.db;
	},
	initDatabase: vi.fn(),
	getDatabaseBackend: () => 'pglite' as const
}));

describe('analytics behavior integration', () => {
	let integrationDb: IntegrationDbContext;
	const repository = new DrizzleAnalyticsBehaviorRepository();
	const service = new AnalyticsBehaviorService(repository);
	const now = new Date('2026-06-10T12:00:00.000Z');

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
		dbState.db = null;
	});

	it('stores page views and click interactions', async () => {
		const enteredAt = new Date('2026-06-09T10:00:00.000Z');
		await service.ingestBeacon(
			{
				visitorId: 'visitor-1',
				userId: null,
				householdId: null,
				userAgent: 'test-agent',
				now: enteredAt
			},
			{
				pageViews: [
					{
						clientId: 'pv-1',
						route: '/hem',
						enteredAt,
						exitedAt: new Date('2026-06-09T10:01:00.000Z'),
						durationMs: 60_000
					}
				],
				interactions: [
					{
						route: '/hem',
						elementKey: 'home-scan-photo',
						kind: 'click',
						createdAt: enteredAt
					}
				]
			}
		);

		const overview = await repository.getBehaviorOverview(7, now);
		expect(overview.routes.some((row) => row.route === '/hem' && row.viewCount >= 1)).toBe(true);

		const heatmap = await repository.getBehaviorHeatmap('/hem', 7, now);
		expect(heatmap.elements.some((row) => row.elementKey === 'home-scan-photo')).toBe(true);
	});

	it('runs daily rollup for yesterday', async () => {
		await service.ingestBeacon(
			{
				visitorId: 'visitor-rollup',
				userId: null,
				householdId: null,
				userAgent: null,
				now: new Date('2026-06-09T09:00:00.000Z')
			},
			{
				pageViews: [
					{
						clientId: 'pv-roll',
						route: '/inkop',
						enteredAt: new Date('2026-06-09T09:00:00.000Z'),
						exitedAt: new Date('2026-06-09T09:05:00.000Z'),
						durationMs: 300_000
					}
				]
			}
		);

		const result = await service.runRollup(new Date('2026-06-10T03:00:00.000Z'));
		expect(result.routeRows).toBeGreaterThanOrEqual(1);
	});
});
