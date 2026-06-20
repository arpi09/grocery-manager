export type ReceiptImportSource = 'one_tap' | 'share_target' | 'scan_hub' | 'onboarding';

export const RECEIPT_IMPORT_SOURCES: readonly ReceiptImportSource[] = [
	'one_tap',
	'share_target',
	'scan_hub',
	'onboarding'
] as const;

export function parseReceiptImportSource(value: string | null | undefined): ReceiptImportSource {
	if (value === 'one_tap' || value === 'share_target' || value === 'onboarding') {
		return value;
	}
	return 'scan_hub';
}

export function isNonScanHubReceiptSource(source: ReceiptImportSource): boolean {
	return source !== 'scan_hub';
}
