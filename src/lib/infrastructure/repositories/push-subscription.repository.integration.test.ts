import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DrizzlePushSubscriptionRepository } from './push-subscription.repository';

describe('DrizzlePushSubscriptionRepository', () => {
	let integrationDb: IntegrationDbContext;
	let repository: DrizzlePushSubscriptionRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzlePushSubscriptionRepository(integrationDb.db);
	});

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('treats stored subscriptions as enabled and syncs the user flag', async () => {
		await integrationDb.seedUser({ id: 'user-1' });

		expect(await repository.isPushEnabled('user-1')).toBe(false);

		await repository.upsert('user-1', {
			endpoint: 'https://push.example.com/subscription/1',
			p256dh: 'p256dh-key',
			auth: 'auth-key'
		});

		expect(await repository.isPushEnabled('user-1')).toBe(true);
		expect(await repository.listByUserId('user-1')).toHaveLength(1);
	});

	it('clears enabled state when the last subscription is removed', async () => {
		await integrationDb.seedUser({ id: 'user-1' });
		const endpoint = 'https://push.example.com/subscription/1';

		await repository.upsert('user-1', {
			endpoint,
			p256dh: 'p256dh-key',
			auth: 'auth-key'
		});
		expect(await repository.isPushEnabled('user-1')).toBe(true);

		await repository.removeByEndpoint('user-1', endpoint);

		expect(await repository.listByUserId('user-1')).toHaveLength(0);
		expect(await repository.isPushEnabled('user-1')).toBe(false);
	});
});
