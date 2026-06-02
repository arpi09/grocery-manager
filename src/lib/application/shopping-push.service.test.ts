import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShoppingPushService } from '$lib/application/shopping-push.service';
import type { ShoppingPushUser } from '$lib/infrastructure/repositories/shopping-push.repository';

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

vi.mock('$lib/server/origin', () => ({
	getAppOrigin: () => 'https://skaffu.test'
}));

describe('ShoppingPushService', () => {
	const repository = {
		getSettings: vi.fn(),
		updateSettings: vi.fn(),
		listOptedInUsers: vi.fn(),
		markPushSent: vi.fn()
	};
	const householdService = {
		listHouseholdsForUser: vi.fn().mockResolvedValue([{ id: 'house-1', name: 'Hemma' }])
	};
	const shoppingListService = {
		listUncheckedItems: vi.fn().mockResolvedValue([{ id: 'item-1', name: 'Mjölk' }])
	};

	const service = new ShoppingPushService(
		repository as never,
		householdService as never,
		shoppingListService as never
	);

	beforeEach(() => {
		vi.clearAllMocks();
		repository.markPushSent.mockResolvedValue(undefined);
	});

	const optedInUser: ShoppingPushUser = {
		id: 'user-1',
		settings: {
			enabled: true,
			lastSentAt: null
		},
		pushNotificationsEnabled: true
	};

	it('sends shopping push when user has unchecked list items', async () => {
		sendPushNotification.mockResolvedValueOnce({ ok: true });
		repository.listOptedInUsers.mockResolvedValueOnce([optedInUser]);

		const result = await service.runDailyShoppingPush();

		expect(result).toEqual({ processed: 1, sent: 1, skipped: 0, failed: 0 });
		expect(sendPushNotification).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'sub-1' }),
			expect.objectContaining({
				title: expect.any(String),
				body: expect.stringContaining('1'),
				tag: 'home-pantry-shopping',
				url: 'https://skaffu.test/inkop'
			})
		);
		expect(repository.markPushSent).toHaveBeenCalledWith('user-1');
	});

	it('persists shopping push opt-in via updateSettings', async () => {
		await service.updateSettings('user-1', true);
		expect(repository.updateSettings).toHaveBeenCalledWith('user-1', true);

		await service.updateSettings('user-1', false);
		expect(repository.updateSettings).toHaveBeenCalledWith('user-1', false);
	});

	it('skips when shopping list is empty', async () => {
		shoppingListService.listUncheckedItems.mockResolvedValueOnce([]);
		repository.listOptedInUsers.mockResolvedValueOnce([optedInUser]);

		const result = await service.runDailyShoppingPush();

		expect(result).toEqual({ processed: 1, sent: 0, skipped: 1, failed: 0 });
		expect(sendPushNotification).not.toHaveBeenCalled();
	});
});
