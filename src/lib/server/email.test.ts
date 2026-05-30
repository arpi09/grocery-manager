import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockEnv, mockSend } = vi.hoisted(() => ({
	mockEnv: {
		RESEND_API_KEY: undefined as string | undefined,
		RESEND_FROM: undefined as string | undefined
	},
	mockSend: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
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
	sendHouseholdInviteEmail
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
		expect(getEmailFrom()).toBe('Home Pantry <onboarding@resend.dev>');
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
		expect(content.html).toContain('Acceptera inbjudan');
		expect(content.html).not.toContain('<script');
	});
});

describe('sendEmail', () => {
	beforeEach(() => {
		mockEnv.RESEND_API_KEY = undefined;
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
				from: 'Home Pantry <onboarding@resend.dev>',
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
