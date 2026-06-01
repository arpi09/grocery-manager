import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockEnv, mockSend, mockIsEmailSendingEnabled } = vi.hoisted(() => ({
	mockEnv: {
		RESEND_API_KEY: undefined as string | undefined,
		RESEND_FROM: undefined as string | undefined,
		EMAIL_SENDING_DISABLED: undefined as string | undefined,
		PMF_DIGEST_TO: undefined as string | undefined
	},
	mockSend: vi.fn(),
	mockIsEmailSendingEnabled: vi.fn().mockResolvedValue(true)
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

vi.mock('$lib/server/di', () => ({
	appSettingsService: {
		isEmailSendingEnabled: mockIsEmailSendingEnabled
	}
}));

vi.mock('resend', () => ({
	Resend: vi.fn().mockImplementation(() => ({
		emails: { send: mockSend }
	}))
}));

import {
	buildHouseholdInviteEmailContent,
	getEmailFrom,
	getResendApiKey,
	householdInviteEmailWarning,
	isResendSandboxRecipientError,
	missingResendKeyMessage,
	sendEmail,
	sendHouseholdInviteEmail,
	sendOwnerPmfDigest,
	getPmfDigestTo,
	EMAIL_SENDING_DISABLED_REASON
} from './email';

describe('getResendApiKey', () => {
	beforeEach(() => {
		mockEnv.RESEND_API_KEY = undefined;
	});

	it('reads RESEND_API_KEY from SvelteKit env', () => {
		mockEnv.RESEND_API_KEY = '  re_test  ';
		expect(getResendApiKey()).toBe('re_test');
	});

	it('returns null when no key is configured', () => {
		expect(getResendApiKey()).toBeNull();
	});
});

describe('getEmailFrom', () => {
	beforeEach(() => {
		mockEnv.RESEND_FROM = undefined;
	});

	it('uses RESEND_FROM when set', () => {
		mockEnv.RESEND_FROM = 'Pantry <mail@example.com>';
		expect(getEmailFrom()).toBe('Pantry <mail@example.com>');
	});

	it('defaults to Resend onboarding address', () => {
		expect(getEmailFrom()).toBe('Skaffu <onboarding@resend.dev>');
	});
});

describe('buildHouseholdInviteEmailContent', () => {
	it('builds Swedish invite copy with role and link', () => {
		const content = buildHouseholdInviteEmailContent({
			inviterName: 'Arvid',
			householdName: 'Mitt hushåll',
			inviteUrl: 'https://app.example/invite/abc',
			role: 'editor',
			locale: 'sv'
		});

		expect(content.subject).toContain('Arvid');
		expect(content.subject).toContain('Mitt hushåll');
		expect(content.text).toContain('Redigera');
		expect(content.text).toContain('https://app.example/invite/abc');
		expect(content.text).toContain('Du är inbjuden till Mitt hushåll');
		expect(content.html).toContain('Du är inbjuden till Mitt hushåll');
		expect(content.html).toContain('Acceptera inbjudan');
		expect(content.html).toContain('#3d6b4f');
		expect(content.html).not.toContain('<script');
	});
});

describe('sendEmail', () => {
	beforeEach(() => {
		mockEnv.RESEND_API_KEY = undefined;
		mockEnv.EMAIL_SENDING_DISABLED = undefined;
		mockIsEmailSendingEnabled.mockResolvedValue(true);
		mockSend.mockReset();
	});

	it('returns ok:false when API key is missing', async () => {
		const result = await sendEmail({
			to: 'guest@example.com',
			subject: 'Test',
			html: '<p>Hej</p>',
			text: 'Hej'
		});

		expect(result).toEqual({ ok: false, reason: 'RESEND_API_KEY is not configured' });
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('no-ops when admin email sending is disabled', async () => {
		mockEnv.RESEND_API_KEY = 're_test';
		mockIsEmailSendingEnabled.mockResolvedValue(false);

		const result = await sendEmail({
			to: 'guest@example.com',
			subject: 'Test',
			html: '<p>Hej</p>',
			text: 'Hej'
		});

		expect(result).toEqual({ ok: false, reason: EMAIL_SENDING_DISABLED_REASON });
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('no-ops when EMAIL_SENDING_DISABLED env is set', async () => {
		mockEnv.RESEND_API_KEY = 're_test';
		mockEnv.EMAIL_SENDING_DISABLED = 'true';

		const result = await sendEmail({
			to: 'guest@example.com',
			subject: 'Test',
			html: '<p>Hej</p>',
			text: 'Hej'
		});

		expect(result).toEqual({ ok: false, reason: EMAIL_SENDING_DISABLED_REASON });
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('sends via Resend when configured', async () => {
		mockEnv.RESEND_API_KEY = 're_test';
		mockSend.mockResolvedValue({ data: { id: 'msg_1' }, error: null });

		const result = await sendEmail({
			to: 'guest@example.com',
			subject: 'Test',
			html: '<p>Hej</p>',
			text: 'Hej'
		});

		expect(result).toEqual({ ok: true, id: 'msg_1' });
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				from: 'Skaffu <onboarding@resend.dev>',
				to: 'guest@example.com',
				subject: 'Test'
			})
		);
	});

	it('returns ok:false when Resend reports an error', async () => {
		mockEnv.RESEND_API_KEY = 're_test';
		mockSend.mockResolvedValue({
			data: null,
			error: { message: 'Invalid from', statusCode: 422 }
		});

		const result = await sendHouseholdInviteEmail({
			to: 'guest@example.com',
			inviterName: 'Arvid',
			householdName: 'Mitt hushåll',
			inviteUrl: 'https://app.example/invite/abc',
			role: 'viewer'
		});

		expect(result).toEqual({ ok: false, reason: 'Invalid from', statusCode: 422 });
	});
});

describe('householdInviteEmailWarning', () => {
	it('returns undefined when email sending is globally disabled', () => {
		expect(
			householdInviteEmailWarning({
				ok: false,
				reason: EMAIL_SENDING_DISABLED_REASON
			})
		).toBeUndefined();
	});

	it('explains missing API key', () => {
		const warning = householdInviteEmailWarning({
			ok: false,
			reason: 'RESEND_API_KEY is not configured'
		});

		expect(warning).toContain(missingResendKeyMessage());
	});

	it('explains Resend sandbox recipient restriction', () => {
		const failure = {
			ok: false as const,
			reason: 'You can only send testing emails to your own email address.',
			statusCode: 403
		};

		expect(isResendSandboxRecipientError(failure)).toBe(true);
		expect(householdInviteEmailWarning(failure)).toContain('testläge');
		expect(householdInviteEmailWarning(failure)).toContain('Resend-konto');
	});

	it('includes sanitized Resend detail in non-production', () => {
		const previousNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'development';

		const warning = householdInviteEmailWarning({
			ok: false,
			reason: 'Domain not verified'
		});

		expect(warning).toContain('Domain not verified');

		process.env.NODE_ENV = previousNodeEnv;
	});
});

describe('sendOwnerPmfDigest', () => {
	beforeEach(() => {
		mockSend.mockClear();
		mockEnv.RESEND_API_KEY = 're_test';
		mockEnv.RESEND_FROM = 'Skaffu <hello@skaffu.com>';
		mockEnv.EMAIL_SENDING_DISABLED = 'true';
		mockEnv.PMF_DIGEST_TO = 'owner@example.com';
		mockIsEmailSendingEnabled.mockResolvedValue(false);
		mockSend.mockResolvedValue({ data: { id: 'pmf-digest-id' }, error: null });
	});

	it('sends even when EMAIL_SENDING_DISABLED and admin toggle are off', async () => {
		const result = await sendOwnerPmfDigest({
			to: 'owner@example.com',
			subject: 'PMF test',
			html: '<p>test</p>',
			text: 'test'
		});

		expect(result).toEqual({ ok: true, id: 'pmf-digest-id' });
		expect(mockSend).toHaveBeenCalledWith(
			expect.objectContaining({
				from: 'Skaffu <hello@skaffu.com>',
				to: 'owner@example.com'
			})
		);
	});

	it('rejects recipient that does not match PMF_DIGEST_TO', async () => {
		const result = await sendOwnerPmfDigest({
			to: 'other@example.com',
			subject: 'PMF test',
			html: '<p>test</p>',
			text: 'test'
		});

		expect(result.ok).toBe(false);
		expect(mockSend).not.toHaveBeenCalled();
	});

	it('no-ops when PMF_DIGEST_TO is unset', async () => {
		mockEnv.PMF_DIGEST_TO = undefined;
		expect(getPmfDigestTo()).toBeNull();

		const result = await sendOwnerPmfDigest({
			to: 'owner@example.com',
			subject: 'PMF test',
			html: '<p>test</p>',
			text: 'test'
		});

		expect(result.ok).toBe(false);
		expect(mockSend).not.toHaveBeenCalled();
	});
});
