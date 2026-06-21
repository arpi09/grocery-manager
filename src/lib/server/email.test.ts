import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockEnv, mockSend, mockIsEmailSendingEnabled } = vi.hoisted(() => ({
	mockEnv: {
		RESEND_API_KEY: undefined as string | undefined,
		RESEND_FROM: undefined as string | undefined,
		EMAIL_SENDING_DISABLED: undefined as string | undefined,
		PMF_DIGEST_TO: undefined as string | undefined,
		ERROR_ALERT_TO: undefined as string | undefined
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
	Resend: class {
		emails = { send: mockSend };
	}
}));

import {
	buildHouseholdInviteEmailContent,
	buildExpiryReminderEmailContent,
	buildEmailVerificationEmailContent,
	buildPasswordResetEmailContent,
	getEmailFrom,
	getResendApiKey,
	householdInviteEmailWarning,
	isResendSandboxRecipientError,
	missingResendKeyMessage,
	sendEmail,
	sendHouseholdInviteEmail,
	sendOwnerPmfDigest,
	getPmfDigestTo,
	getErrorAlertTo,
	sendOwnerErrorAlert,
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
		expect(content.html).toContain('#2c4a3e');
		expect(content.html).toContain('Skaffu');
		expect(content.html).not.toContain('>HP<');
		expect(content.html).not.toContain('<script');
	});

	it('builds English invite copy when locale is en', () => {
		const content = buildHouseholdInviteEmailContent({
			inviterName: 'Alex',
			householdName: 'Home',
			inviteUrl: 'https://app.example/invite/abc',
			role: 'viewer',
			locale: 'en'
		});

		expect(content.subject).toContain('invited you');
		expect(content.text).toContain('You are invited to Home');
		expect(content.html).toContain('Accept invitation');
		expect(content.html).not.toContain('>HP<');
	});
});

describe('buildExpiryReminderEmailContent', () => {
	const sections = [
		{
			householdName: 'Mitt hushåll',
			items: [
				{
					name: 'Mjölk',
					locationLabel: 'Kyl',
					expiresOnLabel: '24 jun',
					daysLeftLabel: '2 dagar kvar'
				}
			]
		}
	];

	it('builds Swedish expiry copy with aligned CTA and week URL', () => {
		const url = 'https://skaffu.com/planer/vecka?from=email';
		const content = buildExpiryReminderEmailContent({
			recipientName: 'Arvid',
			days: 7,
			inventoryUrl: url,
			sections,
			locale: 'sv'
		});

		expect(content.subject).toBe('1 vara går snart ut — Skaffu');
		expect(content.text).toContain('öppna veckoförslagen');
		expect(content.text).toContain(url);
		expect(content.text).not.toContain('Ät det först');
		expect(content.html).toContain('Öppna veckoförslag');
		expect(content.html).toContain(url);
		expect(content.html).not.toContain('Fixa veckan');
		expect(content.html).not.toContain('>HP<');
		expect(content.html).toContain('Skaffu');
	});

	it('builds English expiry copy when locale is en', () => {
		const content = buildExpiryReminderEmailContent({
			recipientName: 'Alex',
			days: 7,
			inventoryUrl: 'https://skaffu.com/planer/vecka?from=email',
			sections: [
				{
					householdName: 'Home',
					items: [
						{
							name: 'Milk',
							locationLabel: 'Fridge',
							expiresOnLabel: 'Jun 24',
							daysLeftLabel: '2 days left'
						},
						{
							name: 'Yogurt',
							locationLabel: 'Fridge',
							expiresOnLabel: 'Jun 25',
							daysLeftLabel: '3 days left'
						}
					]
				}
			],
			locale: 'en'
		});

		expect(content.subject).toBe('2 items expiring soon — Skaffu');
		expect(content.html).toContain('Open week suggestions');
	});
});

describe('buildEmailVerificationEmailContent', () => {
	it('uses branded layout without legacy HP mark', () => {
		const content = buildEmailVerificationEmailContent({
			verifyUrl: 'https://skaffu.com/verify-email/abc',
			locale: 'sv'
		});

		expect(content.subject).toContain('Bekräfta din e-post');
		expect(content.html).toContain('Bekräfta e-post');
		expect(content.html).toContain('Skaffu');
		expect(content.html).not.toContain('>HP<');
	});
});

describe('buildPasswordResetEmailContent', () => {
	it('uses branded layout without legacy HP mark', () => {
		const content = buildPasswordResetEmailContent({
			resetUrl: 'https://skaffu.com/reset/abc',
			locale: 'en'
		});

		expect(content.subject).toContain('Reset your password');
		expect(content.html).toContain('Choose a new password');
		expect(content.html).toContain('Skaffu');
		expect(content.html).not.toContain('>HP<');
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
	it('explains when email sending is globally disabled', () => {
		const warning = householdInviteEmailWarning('sv', {
			ok: false,
			reason: EMAIL_SENDING_DISABLED_REASON
		});

		expect(warning).toContain('E-postutskick');
	});

	it('explains missing API key', () => {
		const warning = householdInviteEmailWarning('sv', {
			ok: false,
			reason: 'RESEND_API_KEY is not configured'
		});

		expect(warning).toContain(missingResendKeyMessage('sv'));
	});

	it('explains Resend sandbox recipient restriction', () => {
		const failure = {
			ok: false as const,
			reason: 'You can only send testing emails to your own email address.',
			statusCode: 403
		};

		expect(isResendSandboxRecipientError(failure)).toBe(true);
		expect(householdInviteEmailWarning('sv', failure)).toContain('testläge');
		expect(householdInviteEmailWarning('sv', failure)).toContain('Resend-konto');
	});

	it('includes sanitized Resend detail in non-production', () => {
		const previousNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'development';

		const warning = householdInviteEmailWarning('en', {
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

describe('getErrorAlertTo', () => {
	beforeEach(() => {
		mockEnv.ERROR_ALERT_TO = undefined;
		mockEnv.PMF_DIGEST_TO = undefined;
	});

	it('prefers ERROR_ALERT_TO over PMF_DIGEST_TO', () => {
		mockEnv.ERROR_ALERT_TO = ' alerts@example.com ';
		mockEnv.PMF_DIGEST_TO = 'pmf@example.com';
		expect(getErrorAlertTo()).toBe('alerts@example.com');
	});

	it('falls back to PMF_DIGEST_TO', () => {
		mockEnv.PMF_DIGEST_TO = 'pmf@example.com';
		expect(getErrorAlertTo()).toBe('pmf@example.com');
	});
});

describe('sendOwnerErrorAlert', () => {
	beforeEach(() => {
		mockSend.mockClear();
		mockEnv.RESEND_API_KEY = 're_test';
		mockEnv.ERROR_ALERT_TO = 'alerts@example.com';
		mockEnv.EMAIL_SENDING_DISABLED = 'true';
		mockIsEmailSendingEnabled.mockResolvedValue(false);
		mockSend.mockResolvedValue({ data: { id: 'alert-id' }, error: null });
	});

	it('sends even when EMAIL_SENDING_DISABLED is set', async () => {
		const result = await sendOwnerErrorAlert({
			to: 'alerts@example.com',
			subject: 'Prod errors',
			html: '<p>errors</p>',
			text: 'errors'
		});

		expect(result).toEqual({ ok: true, id: 'alert-id' });
		expect(mockSend).toHaveBeenCalled();
	});
});
