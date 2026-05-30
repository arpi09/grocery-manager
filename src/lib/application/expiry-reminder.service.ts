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
		if (!user.settings.enabled) {
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

		if (!emailResult.ok) {
			return { status: 'failed', reason: emailResult.reason };
		}

		await this.repository.markReminderSent(user.id);
		return { status: 'sent', itemCount };
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
