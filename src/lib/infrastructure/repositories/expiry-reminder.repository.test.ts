import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleExpiryReminderRepository } from './expiry-reminder.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

let integrationDb: IntegrationDbContext;

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

describe('DrizzleExpiryReminderRepository.tryClaimReminderSend', () => {
	let repository: DrizzleExpiryReminderRepository;
	const now = new Date('2026-06-09T10:00:00Z');

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		repository = new DrizzleExpiryReminderRepository();
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('claims when last_sent is null', async () => {
		const result = await repository.tryClaimReminderSend('user-1', now);

		expect(result.claimed).toBe(true);
		expect(result.previousLastSentAt).toBeNull();
		expect((await repository.getSettings('user-1')).lastSentAt).toEqual(now);
	});

	it('rejects a second claim within the interval', async () => {
		await repository.tryClaimReminderSend('user-1', now);

		const second = await repository.tryClaimReminderSend('user-1', new Date('2026-06-09T11:00:00Z'));

		expect(second.claimed).toBe(false);
		expect(second.previousLastSentAt).toEqual(now);
	});

	it('allows claim after the interval elapses', async () => {
		const firstSent = new Date('2026-06-01T10:00:00Z');
		await repository.markReminderSent('user-1', firstSent);

		const result = await repository.tryClaimReminderSend('user-1', now);

		expect(result.claimed).toBe(true);
		expect(result.previousLastSentAt).toEqual(firstSent);
		expect((await repository.getSettings('user-1')).lastSentAt).toEqual(now);
	});

	it('reverts claim to previous last_sent', async () => {
		const previous = new Date('2026-05-01T10:00:00Z');
		await repository.markReminderSent('user-1', previous);
		const claim = await repository.tryClaimReminderSend('user-1', now);
		expect(claim.claimed).toBe(true);

		await repository.revertReminderSendClaim('user-1', claim.previousLastSentAt);

		expect((await repository.getSettings('user-1')).lastSentAt).toEqual(previous);
	});
});
