import { env } from '$env/dynamic/private';
import Stripe from 'stripe';

export function getStripeSecretKey(): string | null {
	const value = env.STRIPE_SECRET_KEY?.trim();
	return value ? value : null;
}

export function getStripeWebhookSecret(): string | null {
	const value = env.STRIPE_WEBHOOK_SECRET?.trim();
	return value ? value : null;
}

export function getStripePriceIdMonthly(): string | null {
	const value = env.STRIPE_PRICE_ID_MONTHLY?.trim();
	return value ? value : null;
}

export function getStripePriceIdYearly(): string | null {
	const value = env.STRIPE_PRICE_ID_YEARLY?.trim();
	return value ? value : null;
}

export function isStripeConfigured(): boolean {
	return Boolean(
		getStripeSecretKey() &&
			getStripeWebhookSecret() &&
			getStripePriceIdMonthly() &&
			getStripePriceIdYearly()
	);
}

export function isStripeCheckoutConfigured(): boolean {
	return Boolean(
		getStripeSecretKey() && getStripePriceIdMonthly() && getStripePriceIdYearly()
	);
}

export function createStripeClient(): Stripe | null {
	const secretKey = getStripeSecretKey();
	if (!secretKey) {
		return null;
	}

	return new Stripe(secretKey, {
		apiVersion: '2026-05-27.dahlia',
		typescript: true
	});
}

export function getStripePriceIdForInterval(interval: 'month' | 'year'): string | null {
	return interval === 'year' ? getStripePriceIdYearly() : getStripePriceIdMonthly();
}

export function resolveStripeCheckoutEnabled(options: {
	keysConfigured: boolean;
	enabledInApp: boolean;
	envDisabled: boolean;
}): boolean {
	return options.keysConfigured && options.enabledInApp && !options.envDisabled;
}
