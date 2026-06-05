export type StripeCheckoutInterval = 'month' | 'year';

export type StripeCheckoutResult =
	| { ok: true; url: string }
	| { ok: false; error: string };

export async function startStripeCheckout(
	interval: StripeCheckoutInterval
): Promise<StripeCheckoutResult> {
	try {
		const response = await fetch('/api/stripe/checkout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ interval })
		});
		const payload = (await response.json()) as { ok?: boolean; url?: string; error?: string };

		if (!response.ok || !payload.ok || !payload.url) {
			return { ok: false, error: payload.error ?? 'checkout_failed' };
		}

		return { ok: true, url: payload.url };
	} catch {
		return { ok: false, error: 'checkout_failed' };
	}
}
