import { HEM_PATH, INKOP_PATH } from './app-home';
import { postSignupVerifyEmailPath } from './email-verification';

/** Where new password signups land before email is confirmed. */
export function postRegisterPath(): string {
	return postSignupVerifyEmailPath();
}

export const POST_REGISTER_SCAN_PATH = postRegisterPath();

const welcomeParams = new URLSearchParams({ welcome: '1' });

/** Post-register landing — onboarding guide entry on hem. */
export const POST_REGISTER_WELCOME_PATH = `${HEM_PATH}?${welcomeParams.toString()}`;

/** E2E / skip enforcement — land on hem with welcome wedge. */
export function postRegisterAppHomePath(): string {
	return POST_REGISTER_WELCOME_PATH;
}

export const POST_REGISTER_APP_HOME_PATH = postRegisterAppHomePath();

/** Post-verify landing (no freshAccount query param). */
export const POST_REGISTER_INKOP_PATH = INKOP_PATH;

/** OAuth redirect target (callback appends freshAccount for new users). */
export const POST_REGISTER_SCAN_OAUTH_REDIRECT = HEM_PATH;

export function isPostRegisterPath(pathname: string, searchParams: URLSearchParams): boolean {
	if (pathname !== HEM_PATH) {
		return false;
	}
	return searchParams.get('welcome') === '1' || searchParams.get('freshAccount') === '1';
}
