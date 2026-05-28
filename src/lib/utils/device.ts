/** True when the app is running in a browser context. */
export function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

/**
 * Phones and tablets — not laptop/desktop browsers.
 * Does not require camera APIs (iOS hides them on plain HTTP).
 */
export function isMobileDevice(): boolean {
	if (!isBrowser()) {
		return false;
	}

	const ua = navigator.userAgent;
	if (/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
		return true;
	}

	// iPad on iOS 13+ may report as Mac
	if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
		return true;
	}

	return (
		window.matchMedia('(max-width: 768px)').matches &&
		(navigator.maxTouchPoints > 0 || 'ontouchstart' in window)
	);
}

/** Laptop/desktop — barcode button stays disabled with hover hint. */
export function isDesktopDevice(): boolean {
	return isBrowser() && !isMobileDevice();
}

/** Camera access needs HTTPS (or localhost). */
export function canAccessCamera(): boolean {
	if (!isBrowser()) {
		return false;
	}
	return window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);
}

/** @deprecated Use isMobileDevice / isDesktopDevice */
export function canUseBarcodeScanner(): boolean {
	return isMobileDevice();
}

export const BARCODE_SCAN_DISABLED_HINT =
	'Barcode scanning needs a phone or tablet with a camera. On desktop, enter the item manually.';

export const BARCODE_HTTPS_HINT =
	'The camera only works over HTTPS. Open the https:// link shown when you start the dev server (accept the security warning on your phone).';
