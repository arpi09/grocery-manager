import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	isEmailSendingDisabledByEnv,
	type EmailSendingStatus
} from '$lib/application/app-settings.service';

vi.mock('$env/dynamic/private', () => ({
	env: {
		EMAIL_SENDING_DISABLED: undefined as string | undefined
	}
}));

import { env } from '$env/dynamic/private';

describe('isEmailSendingDisabledByEnv', () => {
	afterEach(() => {
		env.EMAIL_SENDING_DISABLED = undefined;
	});

	it('treats unset, false, and empty as not disabled', () => {
		for (const value of [undefined, '', 'false', 'FALSE', '0', 'no']) {
			env.EMAIL_SENDING_DISABLED = value;
			expect(isEmailSendingDisabledByEnv()).toBe(false);
		}
	});

	it('treats true and 1 as disabled', () => {
		for (const value of ['true', 'TRUE', '1']) {
			env.EMAIL_SENDING_DISABLED = value;
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
