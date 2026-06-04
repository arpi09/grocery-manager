/** Where new accounts land — unified scan hub (photo-first), ready to add first item. */
export type PostRegisterScanMode = 'photo';

export function postRegisterScanPath(options?: { mode?: PostRegisterScanMode }): string {
	const params = new URLSearchParams({ freshAccount: '1' });
	if (options?.mode === 'photo') {
		params.set('mode', 'photo');
	}
	return `/scan?${params.toString()}`;
}

export const POST_REGISTER_SCAN_PATH = postRegisterScanPath({ mode: 'photo' });

/** OAuth redirect target (callback appends freshAccount for new users). */
export const POST_REGISTER_SCAN_OAUTH_REDIRECT = '/scan';

export function isPostRegisterScanPath(pathname: string, searchParams: URLSearchParams): boolean {
	return pathname === '/scan' && searchParams.get('freshAccount') === '1';
}
