import type { StripePort } from '$lib/application/ports/stripe.port';
import {
	createStripeClient,
	getStripePriceIdForInterval,
	isStripeCheckoutConfigured
} from '$lib/server/stripe';

export const stripeAdapter: StripePort = {
	createClient: createStripeClient,
	getPriceIdForInterval: getStripePriceIdForInterval,
	isCheckoutConfigured: isStripeCheckoutConfigured
};
