import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDatabase } from '$lib/infrastructure/db';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { generateId } from '$lib/infrastructure/auth/id';
import { productEventTable } from '$lib/infrastructure/db/schema';
import { LAUNCH_COHORT_UNKNOWN_CAMPAIGN } from '$lib/domain/launch-cohort';

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

describe('PmfRepository launch cohort signups', () => {
	let integrationDb: IntegrationDbContext;
	const repository = new DrizzlePmfRepository();
	const now = new Date('2026-06-10T12:00:00Z');

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

	it('groups signup_complete by week and utm_campaign', async () => {
		const userA = generateId();
		const userB = generateId();
		const userC = generateId();
		await integrationDb.seedUser({ id: userA, email: `cohort-a-${userA}@example.com` });
		await integrationDb.seedUser({ id: userB, email: `cohort-b-${userB}@example.com` });
		await integrationDb.seedUser({ id: userC, email: `cohort-c-${userC}@example.com` });

		const events = [
			{
				userId: userA,
				at: new Date('2026-06-02T10:00:00Z'),
				metadata: JSON.stringify({ utm_campaign: 'matsvinn_w12', utm_source: 'facebook' })
			},
			{
				userId: userB,
				at: new Date('2026-06-03T11:00:00Z'),
				metadata: JSON.stringify({ utm_campaign: 'matsvinn_w12', utm_source: 'facebook' })
			},
			{
				userId: userC,
				at: new Date('2026-06-09T09:00:00Z'),
				metadata: JSON.stringify({ utm_campaign: 'zerowaste_w2', utm_source: 'reddit' })
			}
		];

		for (const event of events) {
			await integrationDb.db.insert(productEventTable).values({
				id: generateId(),
				userId: event.userId,
				householdId: null,
				eventType: 'signup_complete',
				metadata: event.metadata,
				createdAt: event.at
			});
		}

		const snapshot = await repository.getLaunchCohortSignups(30, now);

		expect(snapshot.totalSignups).toBe(3);
		expect(snapshot.rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					utmCampaign: 'matsvinn_w12',
					signups: 2
				}),
				expect.objectContaining({
					utmCampaign: 'zerowaste_w2',
					signups: 1
				})
			])
		);
	});

	it('uses unknown campaign label when metadata lacks utm_campaign', async () => {
		const userId = generateId();
		await integrationDb.seedUser({ id: userId, email: `cohort-none-${userId}@example.com` });

		await integrationDb.db.insert(productEventTable).values({
			id: generateId(),
			userId,
			householdId: null,
			eventType: 'signup_complete',
			metadata: JSON.stringify({ variant: 'a' }),
			createdAt: new Date('2026-06-08T10:00:00Z')
		});

		const snapshot = await repository.getLaunchCohortSignups(7, now);

		expect(snapshot.totalSignups).toBe(1);
		expect(snapshot.rows[0]?.utmCampaign).toBe(LAUNCH_COHORT_UNKNOWN_CAMPAIGN);
	});
});
