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
		markReminderSent: vi.fn(),
		tryClaimReminderSend: vi.fn(),
		revertReminderSendClaim: vi.fn()
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
		]),
		listMovingToAutoExpiredSoon: vi.fn().mockResolvedValue([]),
		getAutoExpiredGraceDays: vi.fn().mockResolvedValue(7)
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
		repository.tryClaimReminderSend.mockResolvedValue({
			claimed: true,
			previousLastSentAt: null
		});
		repository.revertReminderSendClaim.mockResolvedValue(undefined);
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
				body: expect.stringMatching(/Mjölk|går ut|expires/i),
				url: 'https://skaffu.test/item/item-1/edit?from=push-moving-soon',
				tag: 'home-pantry-expiry'
			})
		);
		expect(repository.tryClaimReminderSend).toHaveBeenCalledWith('user-1');
		expect(repository.markReminderSent).not.toHaveBeenCalled();
	});

	it('skips when both email and push are disabled', async () => {
		repository.findUserById.mockResolvedValueOnce({
			...pushOnlyUser,
			pushNotificationsEnabled: false
		});

		const result = await service.maybeSendReminderForUser('user-1');

		expect(result).toEqual({ status: 'skipped', reason: 'disabled' });
		expect(sendPushNotification).not.toHaveBeenCalled();
		expect(repository.tryClaimReminderSend).not.toHaveBeenCalled();
	});
});

describe('ExpiryReminderService deduplication', () => {
	const repository = {
		getSettings: vi.fn(),
		updateSettings: vi.fn(),
		listOptedInUsers: vi.fn(),
		findUserById: vi.fn(),
		markReminderSent: vi.fn(),
		tryClaimReminderSend: vi.fn(),
		revertReminderSendClaim: vi.fn()
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
		]),
		listMovingToAutoExpiredSoon: vi.fn().mockResolvedValue([]),
		getAutoExpiredGraceDays: vi.fn().mockResolvedValue(7)
	};
	const pushRepository = {
		listByUserId: vi.fn().mockResolvedValue([])
	};
	const email = {
		sendExpiryReminderEmail: vi.fn().mockResolvedValue({ ok: true }),
		isEmailSendingDisabledFailure: vi.fn().mockReturnValue(false)
	};
	const push = { sendNotification: vi.fn() };
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

	const emailUser: ExpiryReminderUser = {
		id: 'user-1',
		email: 'user@example.com',
		displayName: 'User',
		settings: {
			enabled: true,
			days: 7,
			lastSentAt: null
		},
		pushNotificationsEnabled: false
	};

	beforeEach(() => {
		vi.clearAllMocks();
		repository.markReminderSent.mockResolvedValue(undefined);
		repository.revertReminderSendClaim.mockResolvedValue(undefined);
		repository.findUserById.mockResolvedValue(emailUser);
	});

	it('sends email only once when maybeSendReminderForUser runs in parallel', async () => {
		let claimAttempts = 0;
		repository.tryClaimReminderSend.mockImplementation(async () => {
			claimAttempts += 1;
			if (claimAttempts === 1) {
				return { claimed: true, previousLastSentAt: null };
			}
			return { claimed: false, previousLastSentAt: new Date() };
		});

		const results = await Promise.all([
			service.maybeSendReminderForUser('user-1'),
			service.maybeSendReminderForUser('user-1')
		]);

		expect(email.sendExpiryReminderEmail).toHaveBeenCalledTimes(1);
		expect(results.filter((result) => result.status === 'sent')).toHaveLength(1);
		expect(results.filter((result) => result.status === 'skipped' && result.reason === 'recent')).toHaveLength(
			1
		);
	});

	it('skips send when atomic claim fails', async () => {
		repository.tryClaimReminderSend.mockResolvedValueOnce({
			claimed: false,
			previousLastSentAt: new Date('2026-06-01')
		});

		const result = await service.maybeSendReminderForUser('user-1');

		expect(result).toEqual({ status: 'skipped', reason: 'recent' });
		expect(email.sendExpiryReminderEmail).not.toHaveBeenCalled();
	});

	it('reverts claim when all delivery channels fail', async () => {
		const previousLastSentAt = new Date('2026-05-01');
		repository.tryClaimReminderSend.mockResolvedValueOnce({
			claimed: true,
			previousLastSentAt
		});
		email.sendExpiryReminderEmail.mockResolvedValueOnce({ ok: false, reason: 'Resend error' });

		const result = await service.maybeSendReminderForUser('user-1');

		expect(result.status).toBe('failed');
		expect(repository.revertReminderSendClaim).toHaveBeenCalledWith('user-1', previousLastSentAt);
		expect(repository.markReminderSent).not.toHaveBeenCalled();
	});
});
