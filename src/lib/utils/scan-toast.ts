export const SCAN_TOAST_PARAM = 'scan';
export const SCAN_TOAST_NAME_PARAM = 'scanName';

export type ScanToastKind = 'added' | 'unknown';

export function scanToastMessage(kind: ScanToastKind, productName: string): string {
	const label = productName.trim() || 'Varan';
	if (kind === 'unknown') {
		return `Bra jobbat — "${label}" finns nu i skafferiet (okänd streckkod).`;
	}
	return `Klart! "${label}" ligger nu i skafferiet.`;
}

export function parseScanToastKind(value: string | null): ScanToastKind | null {
	if (value === 'added' || value === 'unknown') {
		return value;
	}
	return null;
}

export function buildScanReturnUrl(
	returnTo: string,
	kind: ScanToastKind,
	productName: string
): string {
	const url = new URL(returnTo, 'http://local');
	url.searchParams.set(SCAN_TOAST_PARAM, kind);
	url.searchParams.set(SCAN_TOAST_NAME_PARAM, productName);
	return `${url.pathname}${url.search}`;
}
