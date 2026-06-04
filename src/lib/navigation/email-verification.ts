import { APP_HOME_PATH } from './app-home';

export const VERIFY_EMAIL_PATH = '/verify-email';

export function verifyEmailTokenPath(rawToken: string): string {
	return `${VERIFY_EMAIL_PATH}/${rawToken}`;
}

export function postSignupVerifyEmailPath(): string {
	return VERIFY_EMAIL_PATH;
}

export function postVerifyWelcomePath(): string {
	const params = new URLSearchParams({ welcome: '1' });
	return `${APP_HOME_PATH}?${params.toString()}`;
}

export function isVerifyEmailPath(pathname: string): boolean {
	return pathname === VERIFY_EMAIL_PATH || pathname.startsWith(`${VERIFY_EMAIL_PATH}/`);
}

export function isVerifyEmailTokenPath(pathname: string): boolean {
	return pathname.startsWith(`${VERIFY_EMAIL_PATH}/`) && pathname.length > VERIFY_EMAIL_PATH.length + 1;
}
