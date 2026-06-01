import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	INSTALL_BANNER_DISMISSED_KEY,
	INSTALL_BANNER_DISMISS_MS,
	canTriggerInstallPrompt,
	isAndroidDevice,
	isInstallBannerDismissed,
	isIosDevice,
	isStandaloneDisplay,
	shouldOfferInstallExperience
} from './pwa';

function withUserAgent(ua: string, run: () => void) {
	vi.stubGlobal('navigator', { userAgent: ua });
	try {
		run();
	} finally {
		vi.unstubAllGlobals();
	}
}

describe('pwa utils', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('reports non-standalone without matchMedia', () => {
		vi.stubGlobal('matchMedia', undefined);
		expect(isStandaloneDisplay()).toBe(false);
	});

	it('detects iOS user agent', () => {
		withUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', () => {
			expect(isIosDevice()).toBe(true);
			expect(isAndroidDevice()).toBe(false);
		});
	});

	it('detects Android user agent', () => {
		withUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8)', () => {
			expect(isAndroidDevice()).toBe(true);
			expect(isIosDevice()).toBe(false);
		});
	});

	it('offers install when mobile and not standalone', () => {
		withUserAgent('Mozilla/5.0 (Linux; Android 14)', () => {
			vi.stubGlobal('matchMedia', () => ({ matches: false }));
			expect(shouldOfferInstallExperience()).toBe(true);
		});
	});

	it('starts without deferred install prompt', () => {
		expect(canTriggerInstallPrompt()).toBe(false);
	});

	it('exports stable banner storage key', () => {
		expect(INSTALL_BANNER_DISMISSED_KEY).toBe('home-pantry-install-banner-dismissed');
	});

	it('treats legacy dismiss flag as dismissed', () => {
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => (key === INSTALL_BANNER_DISMISSED_KEY ? '1' : null),
			setItem: vi.fn()
		});
		expect(isInstallBannerDismissed()).toBe(true);
	});

	it('expires dismiss after configured interval', () => {
		const stale = String(Date.now() - INSTALL_BANNER_DISMISS_MS - 1);
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => (key === INSTALL_BANNER_DISMISSED_KEY ? stale : null),
			setItem: vi.fn()
		});
		expect(isInstallBannerDismissed()).toBe(false);
	});
});