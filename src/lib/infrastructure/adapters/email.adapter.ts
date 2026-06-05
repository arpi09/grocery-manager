import type { EmailPort } from '$lib/application/ports/email.port';
import { isEmailSendingDisabledFailure } from '$lib/application/app-settings.service';
import {
	getPmfDigestTo,
	sendEmailVerificationEmail,
	sendExpiryReminderEmail,
	sendOwnerPmfDigest,
	sendPasswordResetEmail
} from '$lib/server/email';

export const emailAdapter: EmailPort = {
	sendEmailVerificationEmail,
	sendPasswordResetEmail,
	sendExpiryReminderEmail,
	isEmailSendingDisabledFailure,
	getPmfDigestTo,
	sendOwnerPmfDigest
};
