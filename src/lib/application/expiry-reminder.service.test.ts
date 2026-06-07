import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpiryReminderService } from '$lib/application/expiry-reminder.service';
import type { ExpiryReminderUser } from '$lib/infrastructure/repositories/expiry-reminder.repository';

const sendPushNotification = vi.fn();
const deletePushSubscriptionById = vi.fn();

vi.mock('$lib/server/push', () => ({
	sendPushNotification: (...args: unknown[]) => sendPushNotification(...args)
}));

vi.mock('$lib/infrastructure/repositories/push-subscription.repository', () => ({
	DrizzlePushSubscriptionRepository: class {
		listByUserId = vi.fn().mockResolvedValue([
			{
				id: 'sub-1',
				userId: 'user-1',
				endpoint: 'https://push.example.com/1',
				p256dh: 'key',
				auth: 'auth'
			}
		]);
	},
	deletePushSubscriptionById: (...args: unknown[]) => deletePushSubscriptionById(...args)
}));

vi.mock('$lib/server/email', () => ({
	sendExpiryReminderEmail: vi.fn(),
	isEmailSendingDisabledFailure: vi.fn().mockReturnValue(false)
}));

vi.mock('$lib/server/origin', () => ({
	getAppOrigin: () => 'https://skaffu.test'
}));

describe('ExpiryReminderService push delivery', () => {
	const repository = {
		getSettings: vi.fn(),
		updateSettings: vi.fn(),
		listOptedInUsers: vi.fn(),
		findUserById: vi.fn(),
		markReminderSent: vi.fn()
	};
	const householdService = {
		listHouseholdsForUser: vi.fn().mockResolvedValue([{ id: 'house-1', name: 'Hemma' }])
	};
	const inventoryService = {
		listExpiringBefore: vi.fn().mockResolvedValue([
			{
				id: 'item-1',
				name: 'Mjölk',
				location: 'fridge',
				expiresOn: '2026-06-03'
			}
		])
	};

	const pushRepository = {
		listByUserId: vi.fn().mockResolvedValue([
			{
				id: 'sub-1',
				userId: 'user-1',
				endpoint: 'https://push.example.com/1',
				p256dh: 'key',
				auth: 'auth'
			}
		])
	};
	const email = {
		sendExpiryReminderEmail: vi.fn().mockResolvedValue({ ok: true }),
		isEmailSendingDisabledFailure: vi.fn().mockReturnValue(false)
	};
	const push = { sendNotification: sendPushNotification };
	const appOrigin = { getOrigin: () => 'https://skaffu.test' };

	const service = new ExpiryReminderService(
		repository as never,
		householdService as never,
		inventoryService as never,
		pushRepository as never,
		email as never,
		push,
		appOrigin
	);

	beforeEach(() => {
		vi.clearAllMocks();
		repository.markReminderSent.mockResolvedValue(undefined);
	});

	const pushOnlyUser: ExpiryReminderUser = {
		id: 'user-1',
		email: 'user@example.com',
		displayName: 'User',
		settings: {
			enabled: false,
			days: 7,
			lastSentAt: null
		},
		pushNotificationsEnabled: true
	};

	it('sends expiry push when push is enabled and email is off', async () => {
		sendPushNotification.mockResolvedValueOnce({ ok: true });
		repository.findUserById.mockResolvedValueOnce(pushOnlyUser);

		const result = await service.maybeSendReminderForUser('user-1');

		expect(result).toEqual({ status: 'sent', itemCount: 1 });
		expect(sendPushNotification).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'sub-1' }),
			expect.objectContaining({
				title: expect.any(String),
				body: expect.stringMatching(/vecka|week/i),
				url: 'https://skaffu.test/planer/vecka?from=push',
				tag: 'home-pantry-expiry'
			})
		);
		expect(repository.markReminderSent).toHaveBeenCalledWith('user-1');
	});

	it('skips when both email and push are disabled', async () => {
		repository.findUserById.mockResolvedValueOnce({
			...pushOnlyUser,
			pushNotificationsEnabled: false
		});

		const result = await service.maybeSendReminderForUser('user-1');

		expect(result).toEqual({ status: 'skipped', reason: 'disabled' });
		expect(sendPushNotification).not.toHaveBeenCalled();
	});
});
