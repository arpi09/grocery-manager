import { APP_HOME_PATH } from './app-home';

/** Where new accounts land — app home with fresh-account flag (onboarding fast-start). */
export function postRegisterPath(): string {
	const params = new URLSearchParams({ freshAccount: '1' });
	return `${APP_HOME_PATH}?${params.toString()}`;
}

export const POST_REGISTER_SCAN_PATH = postRegisterPath();

/** OAuth redirect target (callback appends freshAccount for new users). */
export const POST_REGISTER_SCAN_OAUTH_REDIRECT = APP_HOME_PATH;

export function isPostRegisterPath(pathname: string, searchParams: URLSearchParams): boolean {
	return pathname === APP_HOME_PATH && searchParams.get('freshAccount') === '1';
}

