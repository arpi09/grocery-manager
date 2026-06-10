import {
	formatNearbyPushPreviewBody,
	NEARBY_PUSH_MAX_VIEWERS,
	shouldSendNearbyPush
} from '$lib/domain/nearby-push';
import type { ExpiringShareSnapshot } from '$lib/domain/expiring-share';
import { distanceMetres, type GeoCoordinate } from '$lib/domain/geo';
import { getNearbyRadiusM, resolveEffectivePlanTier } from '$lib/domain/plan';
import type { AppOriginPort } from '$lib/application/ports/app-origin.port';
import type { PushPort } from '$lib/application/ports/push.port';
import {
	deletePushSubscriptionById,
	type IPushSubscriptionRepository
} from '$lib/infrastructure/repositories/push-subscription.repository';
import type { IExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';
import type {
	INearbyPushRepository,
	NearbyPushViewer
} from '$lib/infrastructure/repositories/nearby-push.repository';
import { translate } from '$lib/i18n/messages';

export type NearbyPushNotifyResult =
	| { status: 'skipped'; reason: 'no_geo' | 'not_found' | 'expired' | 'no_viewers' }
	| { status: 'sent'; viewerCount: number }
	| { status: 'failed'; reason: string };

export class NearbyPushService {
	constructor(
		private readonly repository: INearbyPushRepository,
		private readonly expiringShareRepository: IExpiringShareRepository,
		private readonly pushRepository: IPushSubscriptionRepository,
		private readonly push: PushPort,
		private readonly appOrigin: AppOriginPort
	) {}

	async getSettings(userId: string) {
		return this.repository.getSettings(userId);
	}

	async updateSettings(userId: string, enabled: boolean) {
		await this.repository.updateSettings(userId, enabled);
	}

	async notifyNearbyViewers(shareId: string): Promise<NearbyPushNotifyResult> {
		const share = await this.expiringShareRepository.findShareForNearbyPush(shareId);
		if (!share) {
			return { status: 'skipped', reason: 'not_found' };
		}

		if (share.expiresAt.getTime() <= Date.now()) {
			return { status: 'skipped', reason: 'expired' };
		}

		if (share.latitude == null || share.longitude == null) {
			return { status: 'skipped', reason: 'no_geo' };
		}

		const center: GeoCoordinate = { latitude: share.latitude, longitude: share.longitude };
		const candidates = await this.repository.listOptedInViewersNear(
			center,
			2_000,
			share.createdByUserId
		);

		const eligible: NearbyPushViewer[] = [];
		for (const viewer of candidates) {
			const tier = resolveEffectivePlanTier({ role: viewer.role }, viewer.planTier);
			const radiusM = getNearbyRadiusM(tier);
			const distanceM = distanceMetres(center, {
				latitude: viewer.latitude,
				longitude: viewer.longitude
			});
			if (distanceM > radiusM) {
				continue;
			}

			if (!viewer.settings.enabled || !viewer.pushNotificationsEnabled) {
				continue;
			}

			if (!shouldSendNearbyPush(viewer.settings.lastSentAt)) {
				continue;
			}

			const blockedHouseholdIds = await this.expiringShareRepository.getBlockedHouseholdIds(
				viewer.id
			);
			if (blockedHouseholdIds.includes(share.householdId)) {
				continue;
			}

			eligible.push(viewer);
		}

		eligible.sort(
			(a, b) =>
				distanceMetres(center, { latitude: a.latitude, longitude: a.longitude }) -
				distanceMetres(center, { latitude: b.latitude, longitude: b.longitude })
		);

		const viewers = eligible.slice(0, NEARBY_PUSH_MAX_VIEWERS);
		if (viewers.length === 0) {
			return { status: 'skipped', reason: 'no_viewers' };
		}

		let sentCount = 0;
		for (const viewer of viewers) {
			const delivered = await this.sendNearbyPush(viewer.id, shareId, share.snapshot);
			if (delivered) {
				await this.repository.markPushSent(viewer.id);
				sentCount += 1;
			}
		}

		if (sentCount === 0) {
			return { status: 'failed', reason: 'Push delivery failed' };
		}

		return { status: 'sent', viewerCount: sentCount };
	}

	private async sendNearbyPush(
		userId: string,
		shareId: string,
		snapshot: ExpiringShareSnapshot
	): Promise<boolean> {
		const subscriptions = await this.pushRepository.listByUserId(userId);
		if (subscriptions.length === 0) {
			return false;
		}

		const locale = 'sv';
		const payload = {
			title: translate(locale, 'pushNotifications.nearbyTitle'),
			body: formatNearbyPushPreviewBody(snapshot.items, (count) =>
				translate(locale, 'pushNotifications.nearbyBodyOverflow', { count })
			),
			url: `${this.appOrigin.getOrigin() || ''}/grannskafferiet/share/${shareId}`,
			tag: `skaffu-nearby-${shareId}`
		};

		let delivered = 0;
		for (const subscription of subscriptions) {
			const result = await this.push.sendNotification(subscription, payload);
			if (result.ok) {
				delivered += 1;
				continue;
			}
			if (result.statusCode === 404 || result.statusCode === 410) {
				await deletePushSubscriptionById(subscription.id);
			}
		}

		return delivered > 0;
	}
}
