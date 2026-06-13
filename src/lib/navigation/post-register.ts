import { APP_HOME_PATH } from './app-home';
import { postSignupVerifyEmailPath } from './email-verification';

/** Where new password signups land before email is confirmed. */
export function postRegisterPath(): string {
	return postSignupVerifyEmailPath();
}

export const POST_REGISTER_SCAN_PATH = postRegisterPath();

/** E2E / skip enforcement — land on inköp with fresh-account shortcut. */
export function postRegisterAppHomePath(): string {
	const params = new URLSearchParams({ freshAccount: '1' });
	return `${APP_HOME_PATH}?${params.toString()}`;
}

export const POST_REGISTER_APP_HOME_PATH = postRegisterAppHomePath();

/** Post-verify landing (no freshAccount query param). */
export const POST_REGISTER_INKOP_PATH = APP_HOME_PATH;

/** OAuth redirect target (callback appends freshAccount for new users). */
export const POST_REGISTER_SCAN_OAUTH_REDIRECT = APP_HOME_PATH;

export function isPostRegisterPath(pathname: string, searchParams: URLSearchParams): boolean {
	return pathname === APP_HOME_PATH && searchParams.get('freshAccount') === '1';
}
