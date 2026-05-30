import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';

export const SCAN_TOAST_PARAM = 'scan';
export const SCAN_TOAST_NAME_PARAM = 'scanName';

export type ScanToastKind = 'added' | 'unknown';

export function scanToastMessage(
	locale: Locale,
	kind: ScanToastKind,
	productName: string
): string {
	const label = productName.trim() || translate(locale, 'common.unknownProduct');
	if (kind === 'unknown') {
		return translate(locale, 'scanFlow.toastAddedUnknown', { label });
	}
	return translate(locale, 'scanFlow.toastAdded', { label });
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
