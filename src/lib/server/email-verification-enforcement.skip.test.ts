import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: { EMAIL_VERIFICATION_SKIP: 'true' as string | undefined }
}));

import { isUserEmailVerified } from './email-verification-enforcement';

describe('email-verification-enforcement skip env', () => {
	it('skips enforcement when EMAIL_VERIFICATION_SKIP is enabled', () => {
		expect(isUserEmailVerified({ emailVerifiedAt: null })).toBe(true);
	});
});
