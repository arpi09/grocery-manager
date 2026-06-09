import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	BillingHouseholdMissingError,
	BillingNotConfiguredError,
	BillingService
} from './billing.service';
import type { IBillingRepository } from '$lib/infrastructure/repositories/billing.repository';
import type { AppOriginPort } from '$lib/application/ports/app-origin.port';
import type { StripePort } from '$lib/application/ports/stripe.port';

describe('BillingService', () => {
	let repository: IBillingRepository;
	let stripe: StripePort;
	let appOrigin: AppOriginPort;
	let checkoutGate: { isStripeCheckoutEnabled: ReturnType<typeof vi.fn> };
	let service: BillingService;

	beforeEach(() => {
		repository = {
			getBillingState: vi.fn(),
			updateStripeCustomerId: vi.fn(),
			updateSubscription: vi.fn(),
			adminSetHouseholdPlan: vi.fn()
		};
		stripe = {
			isCheckoutConfigured: vi.fn().mockReturnValue(true),
			createClient: vi.fn(),
			getPriceIdForInterval: vi.fn().mockReturnValue('price_monthly')
		};
		appOrigin = { getOrigin: vi.fn().mockReturnValue('https://app.test') };
		checkoutGate = { isStripeCheckoutEnabled: vi.fn().mockResolvedValue(true) };
		service = new BillingService(repository, stripe, appOrigin, checkoutGate);
	});

	it('throws when checkout is not enabled', async () => {
		vi.mocked(checkoutGate.isStripeCheckoutEnabled).mockResolvedValue(false);

		await expect(
			service.createCheckoutSession({
				householdId: 'hh-1',
				userId: 'user-1',
				userEmail: 'a@example.com',
				interval: 'month'
			})
		).rejects.toBeInstanceOf(BillingNotConfiguredError);
	});

	it('throws when household billing row is missing', async () => {
		vi.mocked(stripe.createClient).mockReturnValue({
			customers: { create: vi.fn() },
			checkout: { sessions: { create: vi.fn() } }
		} as never);
		vi.mocked(repository.getBillingState).mockResolvedValue(null);

		await expect(
			service.createCheckoutSession({
				householdId: 'hh-missing',
				userId: 'user-1',
				userEmail: 'a@example.com',
				interval: 'month'
			})
		).rejects.toBeInstanceOf(BillingHouseholdMissingError);
	});

	it('applies checkout completed without household metadata as no-op', async () => {
		vi.mocked(stripe.createClient).mockReturnValue(null);

		await service.applyCheckoutCompleted({
			metadata: {},
			client_reference_id: null,
			subscription: null
		} as never);

		expect(repository.updateSubscription).not.toHaveBeenCalled();
	});

	it('downgrades plan on subscription deleted', async () => {
		await service.applySubscriptionDeleted({
			id: 'sub_1',
			status: 'canceled',
			metadata: { householdId: 'hh-1' }
		} as never);

		expect(repository.updateSubscription).toHaveBeenCalledWith({
			householdId: 'hh-1',
			planTier: 'free',
			stripeSubscriptionId: null,
			stripeSubscriptionStatus: 'canceled'
		});
	});
});
