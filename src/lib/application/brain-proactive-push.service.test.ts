import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrainProactivePushService } from './brain-proactive-push.service';

vi.mock('$lib/server/brain-proactive-flag', () => ({
	isBrainProactiveEnabled: () => true
}));

vi.mock('$lib/server/brain-feature-flags', () => ({
	isHomeBriefingAiEnabled: () => false
}));

vi.mock('$lib/server/openai', () => ({
	getOpenAiApiKey: () => null
}));

vi.mock('$lib/server/shopping-suggestions', () => ({
	generateShoppingSuggestions: vi.fn(),
	suggestionToListItem: vi.fn()
}));

vi.mock('$lib/server/home-briefing-one-liner', () => ({
	generateHomeBriefingOneLiner: vi.fn()
}));

vi.mock('$lib/server/kivra-import-pending', () => ({
	storeKivraImportPending: vi.fn()
}));

describe('BrainProactivePushService', () => {
	const repository = {
		listPushEnabledUsers: vi.fn(),
		findUserById: vi.fn(),
		tryClaimDailyPush: vi.fn(),
		revertDailyPushClaim: vi.fn(),
		tryClaimWeeklyBriefing: vi.fn(),
		tryClaimPreShopBriefing: vi.fn()
	};
	const householdService = {
		listHouseholdsForUser: vi.fn(),
		getHouseholdMembers: vi.fn()
	};
	const inventoryService = {
		getDashboard: vi.fn()
	};
	const inventoryIntelligenceService = {
		getHomeIntelligence: vi.fn()
	};
	const shoppingListService = {
		listUncheckedItems: vi.fn(),
		addSuggestedItems: vi.fn()
	};
	const purchasePatternService = {
		getHouseholdShoppingCadence: vi.fn()
	};
	const mealPlanService = {};
	const pushRepository = {
		listByUserId: vi.fn()
	};
	const push = { sendNotification: vi.fn() };
	const appOrigin = { getOrigin: () => 'https://skaffu.test' };
	const learningFeedbackRepository = {};

	const service = new BrainProactivePushService(
		repository as never,
		householdService as never,
		inventoryService as never,
		inventoryIntelligenceService as never,
		shoppingListService as never,
		purchasePatternService as never,
		mealPlanService as never,
		pushRepository as never,
		push,
		appOrigin,
		learningFeedbackRepository as never
	);

	beforeEach(() => {
		vi.clearAllMocks();
		repository.tryClaimDailyPush.mockResolvedValue({
			claimed: true,
			previousDailyCount: 0,
			previousDailyDate: null
		});
		push.sendNotification.mockResolvedValue({ ok: true });
		pushRepository.listByUserId.mockResolvedValue([
			{ id: 'sub-1', endpoint: 'https://push.example/1', p256dh: 'k', auth: 'a' }
		]);
	});

	it('skips weekly briefing when not Sunday', async () => {
		repository.listPushEnabledUsers.mockResolvedValueOnce([{ id: 'user-1' }]);
		const friday = new Date('2026-06-19T08:00:00.000Z');

		const result = await service.runWeeklyHouseholdBriefing(friday);

		expect(result.skipped).toBe(1);
		expect(repository.tryClaimWeeklyBriefing).not.toHaveBeenCalled();
	});

	it('sends weekly briefing on Sunday with fallback copy', async () => {
		const sunday = new Date('2026-06-21T08:00:00.000Z');
		repository.listPushEnabledUsers.mockResolvedValueOnce([{ id: 'user-1' }]);
		repository.tryClaimWeeklyBriefing.mockResolvedValueOnce(true);
		householdService.listHouseholdsForUser.mockResolvedValueOnce([
			{ id: 'house-1', role: 'owner', isActive: true }
		]);
		inventoryService.getDashboard.mockResolvedValueOnce({ expiringSoon: [{ name: 'Mjölk' }] });
		inventoryIntelligenceService.getHomeIntelligence.mockResolvedValueOnce({ replenishment: [] });
		shoppingListService.listUncheckedItems.mockResolvedValueOnce([{ id: '1' }, { id: '2' }]);

		const result = await service.runWeeklyHouseholdBriefing(sunday);

		expect(result.sent).toBe(1);
		expect(push.sendNotification).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				tag: 'home-pantry-weekly-briefing',
				url: 'https://skaffu.test/inkop'
			})
		);
	});

	it('notifies household members on partner checkoff', async () => {
		householdService.getHouseholdMembers.mockResolvedValueOnce([
			{ userId: 'actor', displayName: 'Anna', email: 'anna@test.com', role: 'owner' },
			{ userId: 'partner', displayName: 'Erik', email: 'erik@test.com', role: 'editor' }
		]);
		repository.findUserById.mockResolvedValue({
			id: 'partner',
			pushNotificationsEnabled: true
		});

		await service.notifyPartnerCheckoff({
			householdId: 'house-1',
			actorUserId: 'actor',
			itemName: 'Mjölk'
		});

		expect(push.sendNotification).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				tag: 'home-pantry-partner-actor',
				body: expect.stringContaining('Mjölk')
			})
		);
	});
});
