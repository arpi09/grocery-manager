import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	isEmailSendingDisabledByEnv,
	isStripeCheckoutDisabledByEnv,
	type EmailSendingStatus,
	type StripeCheckoutStatus
} from '$lib/application/app-settings.service';
import { resolveStripeCheckoutEnabled } from '$lib/server/stripe';

vi.mock('$env/dynamic/private', () => ({
	env: {
		EMAIL_SENDING_DISABLED: undefined as string | undefined,
		STRIPE_CHECKOUT_DISABLED: undefined as string | undefined
	}
}));

import { env } from '$env/dynamic/private';

const testEnv = env as { EMAIL_SENDING_DISABLED?: string; STRIPE_CHECKOUT_DISABLED?: string };

describe('isEmailSendingDisabledByEnv', () => {
	afterEach(() => {
		delete testEnv.EMAIL_SENDING_DISABLED;
	});

	it('treats unset, false, and empty as not disabled', () => {
		for (const value of [undefined, '', 'false', 'FALSE', '0', 'no'] as const) {
			if (value === undefined) {
				delete testEnv.EMAIL_SENDING_DISABLED;
			} else {
				testEnv.EMAIL_SENDING_DISABLED = value;
			}
			expect(isEmailSendingDisabledByEnv()).toBe(false);
		}
	});

	it('treats true and 1 as disabled', () => {
		for (const value of ['true', 'TRUE', '1'] as const) {
			testEnv.EMAIL_SENDING_DISABLED = value;
			expect(isEmailSendingDisabledByEnv()).toBe(true);
		}
	});
});

describe('email sending effective status', () => {
	it('requires both app toggle and env when computing effective', () => {
		const cases: Array<Pick<EmailSendingStatus, 'enabledInApp' | 'envDisabled'> & { effective: boolean }> =
			[
				{ enabledInApp: false, envDisabled: false, effective: false },
				{ enabledInApp: true, envDisabled: false, effective: true },
				{ enabledInApp: true, envDisabled: true, effective: false },
				{ enabledInApp: false, envDisabled: true, effective: false }
			];

		for (const { enabledInApp, envDisabled, effective } of cases) {
			expect(enabledInApp && !envDisabled).toBe(effective);
		}
	});
});

describe('isStripeCheckoutDisabledByEnv', () => {
	afterEach(() => {
		delete testEnv.STRIPE_CHECKOUT_DISABLED;
	});

	it('treats unset, false, and empty as not disabled', () => {
		for (const value of [undefined, '', 'false', 'FALSE', '0', 'no'] as const) {
			if (value === undefined) {
				delete testEnv.STRIPE_CHECKOUT_DISABLED;
			} else {
				testEnv.STRIPE_CHECKOUT_DISABLED = value;
			}
			expect(isStripeCheckoutDisabledByEnv()).toBe(false);
		}
	});

	it('treats true and 1 as disabled', () => {
		for (const value of ['true', 'TRUE', '1'] as const) {
			testEnv.STRIPE_CHECKOUT_DISABLED = value;
			expect(isStripeCheckoutDisabledByEnv()).toBe(true);
		}
	});
});

describe('stripe checkout effective status', () => {
	it('requires keys, app toggle, and env when computing effective', () => {
		const cases: Array<
			Pick<StripeCheckoutStatus, 'enabledInApp' | 'envDisabled' | 'keysConfigured'> & {
				effective: boolean;
			}
		> = [
			{ keysConfigured: false, enabledInApp: true, envDisabled: false, effective: false },
			{ keysConfigured: true, enabledInApp: false, envDisabled: false, effective: false },
			{ keysConfigured: true, enabledInApp: true, envDisabled: true, effective: false },
			{ keysConfigured: true, enabledInApp: true, envDisabled: false, effective: true }
		];

		for (const { keysConfigured, enabledInApp, envDisabled, effective } of cases) {
			expect(
				resolveStripeCheckoutEnabled({ keysConfigured, enabledInApp, envDisabled })
			).toBe(effective);
		}
	});
});
