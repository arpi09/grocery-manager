import {
	expiryWindowEndDateIso,
	shouldSendExpiryReminder,
	type ExpiryReminderDays
} from '$lib/domain/expiry-reminder';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { daysUntilExpiry, formatExpiryDate } from '$lib/domain/expiry';
import { locationLabel } from '$lib/i18n/domain-labels';
import type { HouseholdService } from '$lib/application/household.service';
import type { InventoryService } from '$lib/application/inventory.service';
import { sendExpiryReminderEmail } from '$lib/server/email';
import {
	deletePushSubscriptionById,
	DrizzlePushSubscriptionRepository
} from '$lib/infrastructure/repositories/push-subscription.repository';
import { sendPushNotification } from '$lib/server/push';
import { translate } from '$lib/i18n/messages';
import { getAppOrigin } from '$lib/server/origin';
import type {
	ExpiryReminderUser,
	IExpiryReminderRepository
} from '$lib/infrastructure/repositories/expiry-reminder.repository';

export interface ExpiryReminderHouseholdSection {
	householdId: string;
	householdName: string;
	items: InventoryItem[];
}

export type ExpiryReminderRunResult =
	| { status: 'skipped'; reason: 'disabled' | 'recent' | 'no_items' }
	| { status: 'sent'; itemCount: number }
	| { status: 'failed'; reason: string };

export interface ExpiryReminderBatchResult {
	processed: number;
	sent: number;
	skipped: number;
	failed: number;
}

export class ExpiryReminderService {
	private readonly pushRepository = new DrizzlePushSubscriptionRepository();

	constructor(
		private readonly repository: IExpiryReminderRepository,
		private readonly householdService: HouseholdService,
		private readonly inventoryService: InventoryService
	) {}

	async getSettings(userId: string) {
		return this.repository.getSettings(userId);
	}

	async updateSettings(userId: string, enabled: boolean, days: ExpiryReminderDays) {
		await this.repository.updateSettings(userId, { enabled, days });
	}

	async runWeeklyReminders(): Promise<ExpiryReminderBatchResult> {
		const users = await this.repository.listOptedInUsers();
		const summary: ExpiryReminderBatchResult = {
			processed: users.length,
			sent: 0,
			skipped: 0,
			failed: 0
		};

		for (const user of users) {
			const result = await this.processUserReminder(user);
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

	async maybeSendReminderForUser(userId: string): Promise<ExpiryReminderRunResult> {
		const user = await this.repository.findUserById(userId);
		if (!user) {
			return { status: 'skipped', reason: 'disabled' };
		}
		return this.processUserReminder(user);
	}

	private async processUserReminder(user: ExpiryReminderUser): Promise<ExpiryReminderRunResult> {
		const emailEnabled = user.settings.enabled;
		const pushEnabled = user.pushNotificationsEnabled;

		if (!emailEnabled && !pushEnabled) {
			return { status: 'skipped', reason: 'disabled' };
		}

		if (!shouldSendExpiryReminder(user.settings.lastSentAt)) {
			return { status: 'skipped', reason: 'recent' };
		}

		const sections = await this.buildHouseholdSections(user.id, user.settings.days);
		const itemCount = sections.reduce((sum, section) => sum + section.items.length, 0);
		if (itemCount === 0) {
			await this.repository.markReminderSent(user.id);
			return { status: 'skipped', reason: 'no_items' };
		}

		let sentAny = false;
		const failures: string[] = [];

		if (emailEnabled) {
			const emailResult = await sendExpiryReminderEmail({
				to: user.email,
				recipientName: user.displayName?.trim() || user.email,
				days: user.settings.days,
				sections: sections.map((section) => ({
					householdName: section.householdName,
					items: section.items.map((item) => ({
						name: item.name,
						locationLabel: locationLabel('sv', item.location),
						expiresOnLabel: item.expiresOn ? formatExpiryDate(item.expiresOn, 'sv') : '',
						daysLeftLabel: item.expiresOn
							? formatDaysLeftSv(daysUntilExpiry(item.expiresOn))
							: ''
					}))
				}))
			});

			if (emailResult.ok) {
				sentAny = true;
			} else {
				failures.push(emailResult.reason);
			}
		}

		if (pushEnabled) {
			const pushResult = await this.sendExpiryPush(user.id, itemCount, user.settings.days);
			if (pushResult.ok) {
				sentAny = true;
			} else if (pushResult.reason !== 'no_subscriptions') {
				failures.push(pushResult.reason);
			}
		}

		if (sentAny) {
			await this.repository.markReminderSent(user.id);
			return { status: 'sent', itemCount };
		}

		return { status: 'failed', reason: failures.join('; ') || 'No delivery channel succeeded' };
	}

	private async sendExpiryPush(
		userId: string,
		itemCount: number,
		days: ExpiryReminderDays
	): Promise<{ ok: true } | { ok: false; reason: string }> {
		const subscriptions = await this.pushRepository.listByUserId(userId);
		if (subscriptions.length === 0) {
			return { ok: false, reason: 'no_subscriptions' };
		}

		const locale = 'sv';
		const payload = {
			title: translate(locale, 'pushNotifications.expiryTitle'),
			body: translate(locale, 'pushNotifications.expiryBody', { count: itemCount, days }),
			url: `${getAppOrigin() || ''}/hem`,
			tag: 'home-pantry-expiry'
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

	private async buildHouseholdSections(
		userId: string,
		days: ExpiryReminderDays
	): Promise<ExpiryReminderHouseholdSection[]> {
		const households = await this.householdService.listHouseholdsForUser(userId);
		const beforeDate = expiryWindowEndDateIso(days);
		const sections: ExpiryReminderHouseholdSection[] = [];

		for (const household of households) {
			const items = await this.inventoryService.listExpiringBefore(household.id, beforeDate);
			if (items.length === 0) {
				continue;
			}
			sections.push({
				householdId: household.id,
				householdName: household.name,
				items
			});
		}

		return sections;
	}
}

function formatDaysLeftSv(days: number): string {
	if (days <= 0) return 'Går ut idag';
	if (days === 1) return '1 dag kvar';
	return `${days} dagar kvar`;
}
