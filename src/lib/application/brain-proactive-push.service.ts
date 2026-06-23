import { canEditInventory, type HouseholdRole } from '$lib/domain/household';
import {
	formatCadenceWeekday,
	shouldShowCadenceWeekday
} from '$lib/domain/household-shopping-cadence';
import { isPreShopReminderDay } from '$lib/domain/brain-push-guard';
import type { HouseholdService } from '$lib/application/household.service';
import type { InventoryService } from '$lib/application/inventory.service';
import type { InventoryIntelligenceService } from '$lib/application/inventory-intelligence.service';
import type { PurchasePatternService } from '$lib/application/purchase-pattern.service';
import type { ShoppingListService } from '$lib/application/shopping-list.service';
import type { MealPlanService } from '$lib/application/meal-plan.service';
import type { AppOriginPort } from '$lib/application/ports/app-origin.port';
import type { PushPort } from '$lib/application/ports/push.port';
import {
	deletePushSubscriptionById,
	type IPushSubscriptionRepository
} from '$lib/infrastructure/repositories/push-subscription.repository';
import type { IBrainPushRepository } from '$lib/infrastructure/repositories/brain-push.repository';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import { generateHomeBriefingOneLiner } from '$lib/server/home-briefing-one-liner';
import { isBrainProactiveEnabled } from '$lib/server/brain-proactive-flag';
import { isHomeBriefingAiEnabled } from '$lib/server/brain-feature-flags';
import { getOpenAiApiKey } from '$lib/server/openai';
import {
	generateShoppingSuggestions,
	suggestionToListItem
} from '$lib/server/shopping-suggestions';
import { storeKivraImportPending } from '$lib/server/kivra-import-pending';
import { translate } from '$lib/i18n/messages';
import type { Locale } from '$lib/i18n/locale';

export type BrainProactivePushRunResult =
	| { status: 'skipped'; reason: string }
	| { status: 'sent'; itemCount?: number }
	| { status: 'failed'; reason: string };

export interface BrainProactivePushBatchResult {
	processed: number;
	sent: number;
	skipped: number;
	failed: number;
}

type PushPayload = {
	title: string;
	body: string;
	url: string;
	tag: string;
};

export class BrainProactivePushService {
	constructor(
		private readonly repository: IBrainPushRepository,
		private readonly householdService: HouseholdService,
		private readonly inventoryService: InventoryService,
		private readonly inventoryIntelligenceService: InventoryIntelligenceService,
		private readonly shoppingListService: ShoppingListService,
		private readonly purchasePatternService: PurchasePatternService,
		private readonly mealPlanService: MealPlanService,
		private readonly pushRepository: IPushSubscriptionRepository,
		private readonly push: PushPort,
		private readonly appOrigin: AppOriginPort,
		private readonly learningFeedbackRepository: ILearningFeedbackRepository
	) {}

	async runWeeklyHouseholdBriefing(now = new Date()): Promise<BrainProactivePushBatchResult> {
		if (!isBrainProactiveEnabled()) {
			return { processed: 0, sent: 0, skipped: 0, failed: 0 };
		}

		const users = await this.repository.listPushEnabledUsers();
		const summary: BrainProactivePushBatchResult = {
			processed: users.length,
			sent: 0,
			skipped: 0,
			failed: 0
		};

		for (const user of users) {
			const result = await this.processWeeklyBriefingForUser(user.id, now);
			if (result.status === 'sent') summary.sent += 1;
			else if (result.status === 'failed') summary.failed += 1;
			else summary.skipped += 1;
		}

		return summary;
	}

	async runPreShopBriefing(now = new Date()): Promise<BrainProactivePushBatchResult> {
		if (!isBrainProactiveEnabled()) {
			return { processed: 0, sent: 0, skipped: 0, failed: 0 };
		}

		const users = await this.repository.listPushEnabledUsers();
		const summary: BrainProactivePushBatchResult = {
			processed: users.length,
			sent: 0,
			skipped: 0,
			failed: 0
		};

		for (const user of users) {
			const result = await this.processPreShopBriefingForUser(user.id, now);
			if (result.status === 'sent') summary.sent += 1;
			else if (result.status === 'failed') summary.failed += 1;
			else summary.skipped += 1;
		}

		return summary;
	}

	async notifyKivraImport(params: {
		householdId: string;
		itemsAdded: number;
	}): Promise<void> {
		if (!isBrainProactiveEnabled() || params.itemsAdded <= 0) return;

		storeKivraImportPending(params.householdId, params.itemsAdded);

		const members = await this.householdService.getHouseholdMembers(params.householdId);
		if (!members) return;

		const locale: Locale = 'sv';
		const payload: PushPayload = {
			title: translate(locale, 'pushNotifications.kivraImportTitle'),
			body: translate(locale, 'pushNotifications.kivraImportBody', { count: params.itemsAdded }),
			url: `${this.appOrigin.getOrigin() || ''}/hem?kivra=imported`,
			tag: 'home-pantry-kivra-import'
		};

		for (const member of members) {
			await this.trySendProactivePush(member.userId, payload);
		}
	}

	async notifyPartnerCheckoff(params: {
		householdId: string;
		actorUserId: string;
		itemName: string;
	}): Promise<void> {
		if (!isBrainProactiveEnabled()) return;

		const members = await this.householdService.getHouseholdMembers(params.householdId);
		if (!members) return;

		const locale: Locale = 'sv';
		const actor = members.find((member) => member.userId === params.actorUserId);
		const actorLabel =
			actor?.displayName?.trim() ||
			actor?.email?.split('@')[0] ||
			translate(locale, 'pushNotifications.partnerFallback');

		const payload: PushPayload = {
			title: translate(locale, 'pushNotifications.partnerCheckoffTitle', { name: actorLabel }),
			body: translate(locale, 'pushNotifications.partnerCheckoffBody', {
				name: actorLabel,
				item: params.itemName
			}),
			url: `${this.appOrigin.getOrigin() || ''}/inventory/cupboard`,
			tag: `home-pantry-partner-${params.actorUserId}`
		};

		for (const member of members) {
			if (member.userId === params.actorUserId) continue;
			await this.trySendProactivePush(member.userId, payload);
		}
	}

	private async processWeeklyBriefingForUser(
		userId: string,
		now: Date
	): Promise<BrainProactivePushRunResult> {
		if (now.getUTCDay() !== 0) {
			return { status: 'skipped', reason: 'not_sunday' };
		}

		if (!(await this.repository.tryClaimWeeklyBriefing(userId, now))) {
			return { status: 'skipped', reason: 'recent' };
		}

		const context = await this.resolveHouseholdContext(userId);
		if (!context) {
			return { status: 'skipped', reason: 'no_household' };
		}

		const { householdId, role, locale } = context;
		const [summary, intelligence, listBefore] = await Promise.all([
			this.inventoryService.getDashboard(householdId),
			this.inventoryIntelligenceService.getHomeIntelligence(householdId),
			this.shoppingListService.listUncheckedItems(householdId)
		]);

		const added = await this.maybeFillShoppingList(userId, householdId, role, locale);
		const listCount = listBefore.length + added;

		let oneLiner: string | null = null;
		const apiKey = getOpenAiApiKey();
		if (apiKey && isHomeBriefingAiEnabled()) {
			oneLiner = await generateHomeBriefingOneLiner(
				apiKey,
				summary,
				intelligence,
				locale,
				listCount
			);
		}

		const expiringCount = summary.expiringSoon.length;
		const body =
			oneLiner?.trim() ||
			translate(locale, 'pushNotifications.weeklyBriefingFallback', {
				expiring: expiringCount,
				count: listCount
			});

		const claim = await this.repository.tryClaimDailyPush(userId, now);
		if (!claim.claimed) {
			return { status: 'skipped', reason: claim.reason ?? 'daily_limit' };
		}

		const sent = await this.deliverPush(userId, {
			title: translate(locale, 'pushNotifications.weeklyBriefingTitle'),
			body,
			url: `${this.appOrigin.getOrigin() || ''}/inkop`,
			tag: 'home-pantry-weekly-briefing'
		});

		if (!sent) {
			await this.repository.revertDailyPushClaim(
				userId,
				claim.previousDailyCount,
				claim.previousDailyDate
			);
			return { status: 'failed', reason: 'push_delivery_failed' };
		}

		return { status: 'sent', itemCount: listCount };
	}

	private async processPreShopBriefingForUser(
		userId: string,
		now: Date
	): Promise<BrainProactivePushRunResult> {
		const todayWeekday = now.getUTCDay();
		if (todayWeekday !== 5 && todayWeekday !== 6) {
			return { status: 'skipped', reason: 'not_pre_shop_day' };
		}

		if (!(await this.repository.tryClaimPreShopBriefing(userId, now))) {
			return { status: 'skipped', reason: 'recent' };
		}

		const context = await this.resolveHouseholdContext(userId);
		if (!context) {
			return { status: 'skipped', reason: 'no_household' };
		}

		const { householdId, role, locale } = context;
		const cadence = await this.purchasePatternService.getHouseholdShoppingCadence(householdId);
		if (!cadence || !shouldShowCadenceWeekday(cadence)) {
			return { status: 'skipped', reason: 'no_cadence' };
		}
		if (!isPreShopReminderDay(todayWeekday, cadence.weekday)) {
			return { status: 'skipped', reason: 'cadence_mismatch' };
		}

		const listBefore = await this.shoppingListService.listUncheckedItems(householdId);
		const added = await this.maybeFillShoppingList(userId, householdId, role, locale);
		const listCount = listBefore.length + added;
		if (listCount === 0) {
			return { status: 'skipped', reason: 'empty_list' };
		}

		const weekdayLabel = formatCadenceWeekday(cadence.weekday, locale);
		const claim = await this.repository.tryClaimDailyPush(userId, now);
		if (!claim.claimed) {
			return { status: 'skipped', reason: claim.reason ?? 'daily_limit' };
		}

		const sent = await this.deliverPush(userId, {
			title: translate(locale, 'pushNotifications.preShopTitle'),
			body: translate(locale, 'pushNotifications.preShopBody', {
				weekday: weekdayLabel,
				count: listCount
			}),
			url: `${this.appOrigin.getOrigin() || ''}/inkop`,
			tag: 'home-pantry-pre-shop'
		});

		if (!sent) {
			await this.repository.revertDailyPushClaim(
				userId,
				claim.previousDailyCount,
				claim.previousDailyDate
			);
			return { status: 'failed', reason: 'push_delivery_failed' };
		}

		return { status: 'sent', itemCount: listCount };
	}

	private async maybeFillShoppingList(
		userId: string,
		householdId: string,
		role: HouseholdRole,
		locale: Locale
	): Promise<number> {
		if (!canEditInventory(role)) return 0;

		const apiKey = getOpenAiApiKey();
		if (!apiKey) return 0;

		const generated = await generateShoppingSuggestions(
			{
				apiKey,
				householdId,
				userId,
				inventoryService: this.inventoryService,
				mealPlanService: this.mealPlanService,
				shoppingListService: this.shoppingListService,
				learningFeedbackRepository: this.learningFeedbackRepository
			},
			{ locale, householdSize: 2 }
		);

		if (!generated.ok || generated.items.length === 0) return 0;

		const result = await this.shoppingListService.addSuggestedItems(
			householdId,
			role,
			generated.items.map(suggestionToListItem)
		);
		return result.added;
	}

	private async resolveHouseholdContext(userId: string): Promise<{
		householdId: string;
		role: HouseholdRole;
		locale: Locale;
	} | null> {
		const households = await this.householdService.listHouseholdsForUser(userId);
		const active = households.find((entry) => entry.isActive) ?? households[0];
		if (!active) return null;
		return {
			householdId: active.id,
			role: active.role,
			locale: 'sv'
		};
	}

	private async resolveHouseholdMembers(householdId: string) {
		return this.householdService.getHouseholdMembers(householdId);
	}

	private async trySendProactivePush(userId: string, payload: PushPayload): Promise<boolean> {
		const user = await this.repository.findUserById(userId);
		if (!user?.pushNotificationsEnabled) return false;

		const claim = await this.repository.tryClaimDailyPush(userId);
		if (!claim.claimed) return false;

		const sent = await this.deliverPush(userId, payload);
		if (!sent) {
			await this.repository.revertDailyPushClaim(
				userId,
				claim.previousDailyCount,
				claim.previousDailyDate
			);
		}
		return sent;
	}

	private async deliverPush(userId: string, payload: PushPayload): Promise<boolean> {
		const subscriptions = await this.pushRepository.listByUserId(userId);
		if (subscriptions.length === 0) return false;

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
