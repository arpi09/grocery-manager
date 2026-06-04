/** Where new accounts land — unified scan hub (photo-first), ready to add first item. */
export const POST_REGISTER_SCAN_PATH = '/scan?freshAccount=1';

/** OAuth redirect target (callback appends freshAccount for new users). */
export const POST_REGISTER_SCAN_OAUTH_REDIRECT = '/scan';

export function isPostRegisterScanPath(pathname: string, searchParams: URLSearchParams): boolean {
	return pathname === '/scan' && searchParams.get('freshAccount') === '1';
}
