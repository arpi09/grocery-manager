import { json } from '@sveltejs/kit';
import { createStripeClient, getStripeWebhookSecret } from '$lib/server/stripe';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const webhookSecret = getStripeWebhookSecret();
	const stripe = createStripeClient();

	if (!webhookSecret || !stripe) {
		return json({ ok: false, error: 'Stripe not configured' }, { status: 503 });
	}

	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return json({ ok: false, error: 'Missing signature' }, { status: 400 });
	}

	const payload = await request.text();
	let event;

	try {
		event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`[stripe] webhook signature verification failed: ${message}`);
		return json({ ok: false, error: 'Invalid signature' }, { status: 400 });
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed':
				await locals.billingService.applyCheckoutCompleted(event.data.object);
				break;
			case 'customer.subscription.updated':
				await locals.billingService.applySubscriptionUpdated(event.data.object);
				break;
			case 'customer.subscription.deleted':
				await locals.billingService.applySubscriptionDeleted(event.data.object);
				break;
			default:
				break;
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[stripe] webhook handler failed for ${event.type}: ${message}`);
		return json({ ok: false, error: 'Webhook handler failed' }, { status: 500 });
	}

	return json({ ok: true, received: true });
};
