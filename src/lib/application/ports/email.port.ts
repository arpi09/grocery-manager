import type { ExpiryReminderDays } from '$lib/domain/expiry-reminder';

export interface ExpiryReminderEmailItem {
	name: string;
	locationLabel: string;
	expiresOnLabel: string;
	daysLeftLabel: string;
}

export interface ExpiryReminderEmailSection {
	householdName: string;
	items: ExpiryReminderEmailItem[];
}

export type SendEmailFailure = { ok: false; reason: string; statusCode?: number };
export type SendEmailResult = { ok: true; id?: string } | SendEmailFailure;

export interface EmailPort {
	sendEmailVerificationEmail(options: {
		to: string;
		verifyUrl: string;
		locale?: 'sv' | 'en';
	}): Promise<SendEmailResult>;

	sendPasswordResetEmail(options: {
		to: string;
		resetUrl: string;
		locale?: 'sv' | 'en';
	}): Promise<SendEmailResult>;

	sendExpiryReminderEmail(options: {
		to: string;
		recipientName: string;
		days: ExpiryReminderDays;
		sections: ExpiryReminderEmailSection[];
		inventoryUrl?: string;
	}): Promise<SendEmailResult>;

	isEmailSendingDisabledFailure(result: SendEmailFailure): boolean;

	getPmfDigestTo(): string | null;

	sendOwnerPmfDigest(input: {
		to: string;
		subject: string;
		html: string;
		text: string;
	}): Promise<SendEmailResult>;
}
