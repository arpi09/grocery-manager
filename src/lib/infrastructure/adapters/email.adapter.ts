import type { EmailPort } from '$lib/application/ports/email.port';
import { isEmailSendingDisabledFailure } from '$lib/application/app-settings.service';
import {
	getPmfDigestTo,
	getErrorAlertTo,
	sendEmailVerificationEmail,
	sendExpiryReminderEmail,
	sendOwnerPmfDigest,
	sendOwnerErrorAlert,
	sendPasswordResetEmail
} from '$lib/server/email';

export const emailAdapter: EmailPort = {
	sendEmailVerificationEmail,
	sendPasswordResetEmail,
	sendExpiryReminderEmail,
	isEmailSendingDisabledFailure,
	getPmfDigestTo,
	sendOwnerPmfDigest,
	getErrorAlertTo,
	sendOwnerErrorAlert
};
