import type { EmailVerificationPolicyPort } from '$lib/application/ports/email-verification-policy.port';
import { isEmailVerificationSkipped } from '$lib/server/email-verification-enforcement';

export const emailVerificationPolicyAdapter: EmailVerificationPolicyPort = {
	isSkipped: isEmailVerificationSkipped
};
