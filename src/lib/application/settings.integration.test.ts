import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleExpiryReminderRepository } from '$lib/infrastructure/repositories/expiry-reminder.repository';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { DrizzleShoppingPushRepository } from '$lib/infrastructure/repositories/shopping-push.repository';
import { updateExpiryRemindersSchema } from '$lib/validation/expiry-reminder.schemas';
import { updateAutoExpiredGraceSchema } from '$lib/validation/auto-expired.schemas';
import { updateShoppingPushSchema } from '$lib/validation/shopping-push.schemas';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

let integrationDb: IntegrationDbContext;

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

function syncExpiryFormEnabled(formData: FormData, enabled: boolean) {
	formData.set('enabled', enabled ? 'true' : 'false');
}

async function applyUpdateExpiryReminders(userId: string, formData: FormData, repo: DrizzleExpiryReminderRepository) {
	const parsed = updateExpiryRemindersSchema.safeParse({
		enabled: formData.get('enabled'),
		days: formData.get('days')
	});
	expect(parsed.success).toBe(true);
	if (!parsed.success) return;

	await repo.updateSettings(userId, {
		enabled: parsed.data.enabled === 'true',
		days: Number(parsed.data.days) as 3 | 7
	});
}

async function applyUpdateShoppingPush(userId: string, formData: FormData, repo: DrizzleShoppingPushRepository) {
	const parsed = updateShoppingPushSchema.safeParse({
		enabled: formData.get('enabled')
	});
	expect(parsed.success).toBe(true);
	if (!parsed.success) return;

	await repo.updateSettings(userId, parsed.data.enabled === 'true');
}

async function applyUpdateAutoExpiredGrace(
	householdId: string,
	formData: FormData,
	repo: DrizzleHouseholdRepository
) {
	const parsed = updateAutoExpiredGraceSchema.safeParse({
		days: formData.get('days')
	});
	expect(parsed.success).toBe(true);
	if (!parsed.success) return;

	await repo.updateAutoExpiredGraceDays(
		householdId,
		Number(parsed.data.days) as 3 | 7 | 14
	);
}

describe('Settings persistence integration', () => {
	let expiryRepo: DrizzleExpiryReminderRepository;
	let shoppingPushRepo: DrizzleShoppingPushRepository;
	let householdRepo: DrizzleHouseholdRepository;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		expiryRepo = new DrizzleExpiryReminderRepository();
		shoppingPushRepo = new DrizzleShoppingPushRepository();
		householdRepo = new DrizzleHouseholdRepository(integrationDb.db);
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('persists expiry email reminders when formData matches toggle (on)', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });

		const formData = new FormData();
		formData.set('enabled', 'false');
		formData.set('days', '7');
		syncExpiryFormEnabled(formData, true);

		await applyUpdateExpiryReminders('user-1', formData, expiryRepo);

		const settings = await expiryRepo.getSettings('user-1');
		expect(settings.enabled).toBe(true);
		expect(settings.days).toBe(7);
	});

	it('corrects stale hidden enabled at submit (toggle race)', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });

		const formData = new FormData();
		formData.set('enabled', 'false');
		formData.set('days', '3');
		syncExpiryFormEnabled(formData, true);

		await applyUpdateExpiryReminders('user-1', formData, expiryRepo);

		expect((await expiryRepo.getSettings('user-1')).enabled).toBe(true);
	});

	it('persists expiry reminders off', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		await expiryRepo.updateSettings('user-1', { enabled: true, days: 7 });

		const formData = new FormData();
		formData.set('days', '7');
		syncExpiryFormEnabled(formData, false);

		await applyUpdateExpiryReminders('user-1', formData, expiryRepo);

		expect((await expiryRepo.getSettings('user-1')).enabled).toBe(false);
	});

	it('persists shopping push opt-in', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });

		const formData = new FormData();
		formData.set('enabled', 'false');
		formData.set('enabled', 'true');

		await applyUpdateShoppingPush('user-1', formData, shoppingPushRepo);

		expect((await shoppingPushRepo.getSettings('user-1')).enabled).toBe(true);

		formData.set('enabled', 'false');
		await applyUpdateShoppingPush('user-1', formData, shoppingPushRepo);

		expect((await shoppingPushRepo.getSettings('user-1')).enabled).toBe(false);
	});

	it('persists auto-expired grace days from validated form data', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-settings-grace',
			name: 'Grace settings',
			members: [{ userId: 'user-1', role: 'owner' }]
		});

		const formData = new FormData();
		formData.set('days', '14');

		await applyUpdateAutoExpiredGrace('household-settings-grace', formData, householdRepo);

		expect(await householdRepo.getAutoExpiredGraceDays('household-settings-grace')).toBe(14);
	});

	it('rejects invalid auto-expired grace days in schema', () => {
		const parsed = updateAutoExpiredGraceSchema.safeParse({ days: '99' });
		expect(parsed.success).toBe(false);
	});
});
