import { describe, expect, it, vi } from 'vitest';
import {
	INSTALL_BANNER_DISMISSED_KEY,
	canTriggerInstallPrompt,
	isAndroidDevice,
	isIosDevice,
	isStandaloneDisplay,
	shouldOfferInstallExperience
} from './pwa';

function withUserAgent(userAgent: string, run: () => void) {
	const spy = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
	try {
		run();
	} finally {
		spy.mockRestore();
	}
}

describe('pwa utils', () => {
	it('reports non-standalone in jsdom', () => {
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
		});
	});

	it('offers install when mobile and not standalone', () => {
		withUserAgent('Mozilla/5.0 (Linux; Android 14)', () => {
			expect(shouldOfferInstallExperience()).toBe(true);
		});
	});

	it('starts without deferred install prompt', () => {
		expect(canTriggerInstallPrompt()).toBe(false);
	});

	it('exports stable banner storage key', () => {
		expect(INSTALL_BANNER_DISMISSED_KEY).toBe('home-pantry-install-banner-dismissed');
	});
});
