/** Where new accounts land — barcode scan hub, ready to add first item. */
export const POST_REGISTER_SCAN_PATH = '/scan?freshAccount=1&mode=barcode';

/** OAuth redirect target (callback appends freshAccount for new users). */
export const POST_REGISTER_SCAN_OAUTH_REDIRECT = '/scan?mode=barcode';

export function isPostRegisterScanPath(pathname: string, searchParams: URLSearchParams): boolean {
	return pathname === '/scan' && searchParams.get('mode') === 'barcode';
}
