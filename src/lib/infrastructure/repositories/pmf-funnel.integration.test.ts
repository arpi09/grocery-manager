import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDatabase } from '$lib/infrastructure/db';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzlePmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { generateId } from '$lib/infrastructure/auth/id';
import { productEventTable, userTable } from '$lib/infrastructure/db/schema';
import { eq } from 'drizzle-orm';

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

describe('PmfRepository funnel metrics', () => {
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

	it('aggregates visits, signups, first scan, and D1 retention from product_event', async () => {
		const userId = generateId();
		await integrationDb.seedUser({ id: userId, email: `funnel-${userId}@example.com` });
		const registeredAt = new Date('2026-06-05T10:00:00Z');
		await integrationDb.db
			.update(userTable)
			.set({ createdAt: registeredAt })
			.where(eq(userTable.id, userId));

		const events = [
			{ eventType: 'landing_view' as const, userId: null as string | null, at: new Date('2026-06-05T09:00:00Z') },
			{ eventType: 'landing_view' as const, userId: null, at: new Date('2026-06-06T10:00:00Z') },
			{ eventType: 'signup_complete' as const, userId, at: new Date('2026-06-05T10:05:00Z') },
			{ eventType: 'scan_completed' as const, userId, at: new Date('2026-06-05T11:00:00Z') },
			{ eventType: 'scan_completed' as const, userId, at: new Date('2026-06-06T09:00:00Z') }
		];

		for (const event of events) {
			await integrationDb.db.insert(productEventTable).values({
				id: generateId(),
				userId: event.userId,
				householdId: null,
				eventType: event.eventType,
				metadata: null,
				createdAt: event.at
			});
		}

		const funnel = await repository.getFunnelMetrics(7, now);

		expect(funnel.visitsSource).toBe('landing_view');
		expect(funnel.visits).toBe(2);
		expect(funnel.signups).toBe(1);
		expect(funnel.firstScans).toBe(1);
		expect(funnel.d1EligibleUsers).toBe(1);
		expect(funnel.d1RetainedUsers).toBe(1);
		expect(funnel.d1Retention).toBe(1);
	});
});
