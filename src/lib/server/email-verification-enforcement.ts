import { env } from '$env/dynamic/private';
import { isMarketingPath } from '$lib/marketing/routes';

export function isEmailVerificationSkipped(): boolean {
	const raw = env.EMAIL_VERIFICATION_SKIP?.trim().toLowerCase();
	return raw === 'true' || raw === '1';
}

export function isUserEmailVerified(user: { emailVerifiedAt: Date | null } | null | undefined): boolean {
	if (!user) {
		return false;
	}
	if (isEmailVerificationSkipped()) {
		return true;
	}
	return user.emailVerifiedAt != null;
}

export function isEmailVerificationPath(pathname: string): boolean {
	return pathname === '/verify-email' || pathname.startsWith('/verify-email/');
}

export function isPathAllowedForUnverifiedUser(pathname: string): boolean {
	if (isEmailVerificationPath(pathname)) {
		return true;
	}
	if (pathname === '/logout' || pathname === '/login') {
		return true;
	}
	if (isMarketingPath(pathname)) {
		return true;
	}
	return false;
}

export function shouldRedirectUnverifiedUser(
	user: { emailVerifiedAt: Date | null } | null | undefined,
	pathname: string
): boolean {
	if (!user || isUserEmailVerified(user)) {
		return false;
	}
	return !isPathAllowedForUnverifiedUser(pathname);
}
