import type Stripe from 'stripe';
import type { BillingInterval } from '$lib/domain/billing';

export interface StripePort {
	createClient(): Stripe | null;
	getPriceIdForInterval(interval: BillingInterval): string | null;
	isCheckoutConfigured(): boolean;
}
