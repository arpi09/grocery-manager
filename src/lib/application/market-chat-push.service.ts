import { marketFirstName } from '$lib/domain/market-profile';
import type { AppOriginPort } from '$lib/application/ports/app-origin.port';
import type { PushPort } from '$lib/application/ports/push.port';
import { translate } from '$lib/i18n/messages';
import type { IMarketChatRepository } from '$lib/infrastructure/repositories/market-chat.repository';
import type { IMarketChatPushRepository } from '$lib/infrastructure/repositories/market-chat-push.repository';
import {
	deletePushSubscriptionById,
	type IPushSubscriptionRepository
} from '$lib/infrastructure/repositories/push-subscription.repository';

export type MarketChatPushNotifyResult =
	| { status: 'skipped'; reason: 'opt_out' | 'no_push' | 'self' }
	| { status: 'sent' }
	| { status: 'failed'; reason: string };

export type MarketChatReplyReminderResult = {
	checked: number;
	sent: number;
	skipped: number;
	failed: number;
};

export class MarketChatPushService {
	constructor(
		private readonly settingsRepository: IMarketChatPushRepository,
		private readonly chatRepository: IMarketChatRepository,
		private readonly pushRepository: IPushSubscriptionRepository,
		private readonly push: PushPort,
		private readonly appOrigin: AppOriginPort
	) {}

	async getSettings(userId: string) {
		return this.settingsRepository.getSettings(userId);
	}

	async updateSettings(userId: string, enabled: boolean) {
		await this.settingsRepository.updateSettings(userId, enabled);
	}

	async notifyNewMessage(input: {
		threadId: string;
		senderUserId: string;
		recipientUserId: string;
		bodyPreview: string;
	}): Promise<MarketChatPushNotifyResult> {
		if (input.senderUserId === input.recipientUserId) {
			return { status: 'skipped', reason: 'self' };
		}

		const enabled = await this.settingsRepository.isEnabled(input.recipientUserId);
		if (!enabled) {
			return { status: 'skipped', reason: 'opt_out' };
		}

		const profiles = await this.chatRepository.findMarketProfiles([input.senderUserId]);
		const senderName = marketFirstName(profiles[0] ?? {});
		const preview =
			input.bodyPreview.length > 80 ? `${input.bodyPreview.slice(0, 77)}…` : input.bodyPreview;

		return this.sendPush(input.recipientUserId, {
			title: translate('sv', 'pushNotifications.marketChatTitle', { name: senderName }),
			body: preview,
			url: `${this.appOrigin.getOrigin() || ''}/grannskafferiet/marknad/chatt/${input.threadId}`,
			tag: `skaffu-market-chat-${input.threadId}`
		});
	}

	async notifyReplyReminder(input: {
		threadId: string;
		recipientUserId: string;
	}): Promise<MarketChatPushNotifyResult> {
		const enabled = await this.settingsRepository.isEnabled(input.recipientUserId);
		if (!enabled) {
			return { status: 'skipped', reason: 'opt_out' };
		}

		return this.sendPush(input.recipientUserId, {
			title: translate('sv', 'pushNotifications.marketChatReminderTitle'),
			body: translate('sv', 'pushNotifications.marketChatReminderBody'),
			url: `${this.appOrigin.getOrigin() || ''}/grannskafferiet/marknad/chatt/${input.threadId}`,
			tag: `skaffu-market-chat-reminder-${input.threadId}`
		});
	}

	async runReplyReminders(now = new Date()): Promise<MarketChatReplyReminderResult> {
		const candidates = await this.chatRepository.listThreadsNeedingReplyReminder(now);
		const result: MarketChatReplyReminderResult = {
			checked: candidates.length,
			sent: 0,
			skipped: 0,
			failed: 0
		};

		for (const candidate of candidates) {
			const notify = await this.notifyReplyReminder({
				threadId: candidate.thread.id,
				recipientUserId: candidate.recipientUserId
			});

			if (notify.status === 'sent') {
				await this.chatRepository.markReplyReminderSent(candidate.thread.id, now);
				result.sent += 1;
			} else if (notify.status === 'skipped') {
				result.skipped += 1;
			} else {
				result.failed += 1;
			}
		}

		return result;
	}

	private async sendPush(
		userId: string,
		payload: { title: string; body: string; url: string; tag: string }
	): Promise<MarketChatPushNotifyResult> {
		const subscriptions = await this.pushRepository.listByUserId(userId);
		if (subscriptions.length === 0) {
			return { status: 'skipped', reason: 'no_push' };
		}

		const pushEnabled = await this.pushRepository.isPushEnabled(userId);
		if (!pushEnabled) {
			return { status: 'skipped', reason: 'no_push' };
		}

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

		return delivered > 0 ? { status: 'sent' } : { status: 'failed', reason: 'Push delivery failed' };
	}
}
