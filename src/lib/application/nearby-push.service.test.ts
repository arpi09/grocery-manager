import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NearbyPushService } from '$lib/application/nearby-push.service';
import type { ExpiringShareSnapshot } from '$lib/domain/expiring-share';

describe('NearbyPushService', () => {
	const repository = {
		getSettings: vi.fn(),
		updateSettings: vi.fn(),
		markPushSent: vi.fn(),
		listOptedInViewersNear: vi.fn()
	};
	const expiringShareRepository = {
		findShareForNearbyPush: vi.fn(),
		getBlockedHouseholdIds: vi.fn().mockResolvedValue([])
	};
	const pushRepository = {
		listByUserId: vi.fn().mockResolvedValue([
			{
				id: 'sub-1',
				userId: 'viewer-1',
				endpoint: 'https://push.example.com/1',
				p256dh: 'key',
				auth: 'auth'
			}
		])
	};
	const push = { sendNotification: vi.fn().mockResolvedValue({ ok: true, delivered: 1 }) };
	const appOrigin = { getOrigin: () => 'https://skaffu.test' };

	const service = new NearbyPushService(
		repository as never,
		expiringShareRepository as never,
		pushRepository as never,
		push,
		appOrigin
	);

	const snapshot: ExpiringShareSnapshot = {
		items: [{ name: 'Yoghurt', expiresOn: '2026-06-12', location: 'fridge', quantity: '1', unit: null }],
		createdAt: new Date().toISOString()
	};

	beforeEach(() => {
		vi.clearAllMocks();
		expiringShareRepository.getBlockedHouseholdIds.mockResolvedValue([]);
	});

	it('notifies viewer within radius with preview payload', async () => {
		expiringShareRepository.findShareForNearbyPush.mockResolvedValue({
			id: 'share-1',
			householdId: 'sharer-household',
			createdByUserId: 'sharer-user',
			latitude: 59.329,
			longitude: 18.069,
			snapshot,
			expiresAt: new Date(Date.now() + 60_000)
		});
		repository.listOptedInViewersNear.mockResolvedValue([
			{
				id: 'viewer-1',
				role: 'user',
				planTier: 'free',
				settings: { enabled: true, lastSentAt: null },
				pushNotificationsEnabled: true,
				nearbySharingEnabled: true,
				latitude: 59.3295,
				longitude: 18.0695
			}
		]);

		const result = await service.notifyNearbyViewers('share-1');

		expect(result).toEqual({ status: 'sent', viewerCount: 1 });
		expect(push.sendNotification).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'sub-1' }),
			expect.objectContaining({
				title: expect.any(String),
				body: expect.stringContaining('Yoghurt'),
				tag: 'skaffu-nearby-share-1',
				url: 'https://skaffu.test/grannskafferiet/share/share-1'
			})
		);
		expect(repository.markPushSent).toHaveBeenCalledWith('viewer-1');
	});

	it('skips viewer outside free radius', async () => {
		expiringShareRepository.findShareForNearbyPush.mockResolvedValue({
			id: 'share-1',
			householdId: 'sharer-household',
			createdByUserId: 'sharer-user',
			latitude: 59.329,
			longitude: 18.069,
			snapshot,
			expiresAt: new Date(Date.now() + 60_000)
		});
		repository.listOptedInViewersNear.mockResolvedValue([
			{
				id: 'viewer-1',
				role: 'user',
				planTier: 'free',
				settings: { enabled: true, lastSentAt: null },
				pushNotificationsEnabled: true,
				nearbySharingEnabled: true,
				latitude: 59.34,
				longitude: 18.09
			}
		]);

		const result = await service.notifyNearbyViewers('share-1');
		expect(result).toEqual({ status: 'skipped', reason: 'no_viewers' });
		expect(push.sendNotification).not.toHaveBeenCalled();
	});

	it('skips blocked household viewers', async () => {
		expiringShareRepository.findShareForNearbyPush.mockResolvedValue({
			id: 'share-1',
			householdId: 'sharer-household',
			createdByUserId: 'sharer-user',
			latitude: 59.329,
			longitude: 18.069,
			snapshot,
			expiresAt: new Date(Date.now() + 60_000)
		});
		repository.listOptedInViewersNear.mockResolvedValue([
			{
				id: 'viewer-1',
				role: 'user',
				planTier: 'free',
				settings: { enabled: true, lastSentAt: null },
				pushNotificationsEnabled: true,
				nearbySharingEnabled: true,
				latitude: 59.3295,
				longitude: 18.0695
			}
		]);
		expiringShareRepository.getBlockedHouseholdIds.mockResolvedValue(['sharer-household']);

		const result = await service.notifyNearbyViewers('share-1');
		expect(result).toEqual({ status: 'skipped', reason: 'no_viewers' });
	});
});
