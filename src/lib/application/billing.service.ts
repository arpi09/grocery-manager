import type Stripe from 'stripe';
import {
	planTierFromStripeSubscriptionStatus,
	resolvePlanTierFromBilling,
	type BillingInterval,
	type HouseholdBillingState
} from '$lib/domain/billing';
import { DEFAULT_PLAN_TIER, type PlanTier } from '$lib/domain/plan';
import type { IBillingRepository } from '$lib/infrastructure/repositories/billing.repository';
import {
	createStripeClient,
	getStripePriceIdForInterval,
	isStripeCheckoutConfigured
} from '$lib/server/stripe';
import { getAppOrigin } from '$lib/server/origin';

export class BillingNotConfiguredError extends Error {
	readonly name = 'BillingNotConfiguredError';
}

export class BillingHouseholdMissingError extends Error {
	readonly name = 'BillingHouseholdMissingError';
}

export class BillingPortalUnavailableError extends Error {
	readonly name = 'BillingPortalUnavailableError';
}

export interface CreateCheckoutSessionInput {
	householdId: string;
	userId: string;
	userEmail: string;
	interval: BillingInterval;
	origin?: string;
}

export class BillingService {
	constructor(private readonly repository: IBillingRepository) {}

	async getPlanTier(householdId: string | null): Promise<PlanTier> {
		if (!householdId) {
			return DEFAULT_PLAN_TIER;
		}

		const state = await this.repository.getBillingState(householdId);
		if (!state) {
			return DEFAULT_PLAN_TIER;
		}

		return resolvePlanTierFromBilling(state);
	}

	async getBillingState(householdId: string): Promise<HouseholdBillingState | null> {
		return this.repository.getBillingState(householdId);
	}

	async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<{ url: string }> {
		if (!isStripeCheckoutConfigured()) {
			throw new BillingNotConfiguredError();
		}

		const stripe = createStripeClient();
		const priceId = getStripePriceIdForInterval(input.interval);
		if (!stripe || !priceId) {
			throw new BillingNotConfiguredError();
		}

		const billing = await this.repository.getBillingState(input.householdId);
		if (!billing) {
			throw new BillingHouseholdMissingError();
		}

		const origin = getAppOrigin(input.origin);
		let customerId = billing.stripeCustomerId;

		if (!customerId) {
			const customer = await stripe.customers.create({
				email: input.userEmail,
				metadata: {
					householdId: input.householdId,
					userId: input.userId
				}
			});
			customerId = customer.id;
			await this.repository.updateStripeCustomerId(input.householdId, customerId);
		}

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: customerId,
			client_reference_id: input.householdId,
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: `${origin}/settings?checkout=success`,
			cancel_url: `${origin}/settings?checkout=cancel`,
			metadata: {
				householdId: input.householdId,
				userId: input.userId,
				interval: input.interval
			},
			subscription_data: {
				metadata: {
					householdId: input.householdId,
					userId: input.userId
				}
			}
		});

		if (!session.url) {
			throw new Error('Stripe checkout session missing url');
		}

		return { url: session.url };
	}

	async applyCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
		const householdId = session.metadata?.householdId ?? session.client_reference_id;
		const subscriptionId =
			typeof session.subscription === 'string'
				? session.subscription
				: session.subscription?.id ?? null;

		if (!householdId) {
			console.warn('[stripe] checkout.session.completed without householdId');
			return;
		}

		const stripe = createStripeClient();
		let status: string | null = 'active';
		if (stripe && subscriptionId) {
			const subscription = await stripe.subscriptions.retrieve(subscriptionId);
			status = subscription.status;
		}

		await this.repository.updateSubscription({
			householdId,
			planTier: planTierFromStripeSubscriptionStatus(status),
			stripeSubscriptionId: subscriptionId,
			stripeSubscriptionStatus: status
		});
	}

	async applySubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
		const householdId = subscription.metadata.householdId;
		if (!householdId) {
			console.warn('[stripe] subscription update without householdId metadata');
			return;
		}

		await this.repository.updateSubscription({
			householdId,
			planTier: planTierFromStripeSubscriptionStatus(subscription.status),
			stripeSubscriptionId: subscription.id,
			stripeSubscriptionStatus: subscription.status
		});
	}

	async createPortalSession(input: {
		householdId: string;
		origin?: string;
	}): Promise<{ url: string }> {
		if (!isStripeCheckoutConfigured()) {
			throw new BillingNotConfiguredError();
		}

		const stripe = createStripeClient();
		if (!stripe) {
			throw new BillingNotConfiguredError();
		}

		const billing = await this.repository.getBillingState(input.householdId);
		if (!billing?.stripeCustomerId) {
			throw new BillingPortalUnavailableError();
		}

		const origin = getAppOrigin(input.origin);
		const session = await stripe.billingPortal.sessions.create({
			customer: billing.stripeCustomerId,
			return_url: `${origin}/settings?checkout=portal#settings-plan`
		});

		if (!session.url) {
			throw new Error('Stripe portal session missing url');
		}

		return { url: session.url };
	}

	async adminSetHouseholdPlan(input: {
		householdId: string;
		planTier: PlanTier;
		clearStripe: boolean;
	}): Promise<void> {
		const billing = await this.repository.getBillingState(input.householdId);
		if (!billing) {
			throw new BillingHouseholdMissingError();
		}

		await this.repository.adminSetHouseholdPlan(input);
	}

	async applySubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
		const householdId = subscription.metadata.householdId;
		if (!householdId) {
			console.warn('[stripe] subscription delete without householdId metadata');
			return;
		}

		await this.repository.updateSubscription({
			householdId,
			planTier: 'free',
			stripeSubscriptionId: null,
			stripeSubscriptionStatus: subscription.status
		});
	}
}
