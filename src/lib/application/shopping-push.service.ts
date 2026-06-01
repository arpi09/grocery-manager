import { shouldSendShoppingPush } from '$lib/domain/shopping-push';
import type { HouseholdService } from '$lib/application/household.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import {
	deletePushSubscriptionById,
	DrizzlePushSubscriptionRepository
} from '$lib/infrastructure/repositories/push-subscription.repository';
import type {
	IShoppingPushRepository,
	ShoppingPushUser
} from '$lib/infrastructure/repositories/shopping-push.repository';
import { sendPushNotification } from '$lib/server/push';
import { translate } from '$lib/i18n/messages';
import { getAppOrigin } from '$lib/server/origin';

export type ShoppingPushRunResult =
	| { status: 'skipped'; reason: 'disabled' | 'recent' | 'no_items' | 'no_subscriptions' }
	| { status: 'sent'; itemCount: number }
	| { status: 'failed'; reason: string };

export interface ShoppingPushBatchResult {
	processed: number;
	sent: number;
	skipped: number;
	failed: number;
}

export class ShoppingPushService {
	private readonly pushRepository = new DrizzlePushSubscriptionRepository();

	constructor(
		private readonly repository: IShoppingPushRepository,
		private readonly householdService: HouseholdService,
		private readonly shoppingListService: ShoppingListService
	) {}

	async getSettings(userId: string) {
		return this.repository.getSettings(userId);
	}

	async updateSettings(userId: string, enabled: boolean) {
		await this.repository.updateSettings(userId, enabled);
	}

	async runDailyShoppingPush(): Promise<ShoppingPushBatchResult> {
		const users = await this.repository.listOptedInUsers();
		const summary: ShoppingPushBatchResult = {
			processed: users.length,
			sent: 0,
			skipped: 0,
			failed: 0
		};

		for (const user of users) {
			const result = await this.processUserPush(user);
			if (result.status === 'sent') {
				summary.sent += 1;
			} else if (result.status === 'failed') {
				summary.failed += 1;
			} else {
				summary.skipped += 1;
			}
		}

		return summary;
	}

	private async processUserPush(user: ShoppingPushUser): Promise<ShoppingPushRunResult> {
		if (!user.settings.enabled || !user.pushNotificationsEnabled) {
			return { status: 'skipped', reason: 'disabled' };
		}

		if (!shouldSendShoppingPush(user.settings.lastSentAt)) {
			return { status: 'skipped', reason: 'recent' };
		}

		const itemCount = await this.countUncheckedItems(user.id);
		if (itemCount === 0) {
			return { status: 'skipped', reason: 'no_items' };
		}

		const pushResult = await this.sendShoppingPush(user.id, itemCount);
		if (pushResult.ok) {
			await this.repository.markPushSent(user.id);
			return { status: 'sent', itemCount };
		}

		if (pushResult.reason === 'no_subscriptions') {
			return { status: 'skipped', reason: 'no_subscriptions' };
		}

		return { status: 'failed', reason: pushResult.reason };
	}

	private async countUncheckedItems(userId: string): Promise<number> {
		const households = await this.householdService.listHouseholdsForUser(userId);
		let total = 0;

		for (const household of households) {
			const items = await this.shoppingListService.listUncheckedItems(household.id);
			total += items.length;
		}

		return total;
	}

	private async sendShoppingPush(
		userId: string,
		itemCount: number
	): Promise<{ ok: true } | { ok: false; reason: string }> {
		const subscriptions = await this.pushRepository.listByUserId(userId);
		if (subscriptions.length === 0) {
			return { ok: false, reason: 'no_subscriptions' };
		}

		const locale = 'sv';
		const payload = {
			title: translate(locale, 'pushNotifications.shoppingTitle'),
			body: translate(locale, 'pushNotifications.shoppingBody', { count: itemCount }),
			url: `${getAppOrigin() || ''}/inkop`,
			tag: 'home-pantry-shopping'
		};

		let delivered = 0;
		for (const subscription of subscriptions) {
			const result = await sendPushNotification(subscription, payload);
			if (result.ok) {
				delivered += 1;
				continue;
			}
			if (result.statusCode === 404 || result.statusCode === 410) {
				await deletePushSubscriptionById(subscription.id);
			}
		}

		if (delivered > 0) {
			return { ok: true };
		}
		return { ok: false, reason: 'Push delivery failed' };
	}
}
