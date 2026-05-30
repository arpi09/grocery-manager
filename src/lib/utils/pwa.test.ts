import { describe, expect, it } from 'vitest';
import {
	INSTALL_BANNER_DISMISSED_KEY,
	canTriggerInstallPrompt,
	isAndroidDevice,
	isIosDevice,
	isStandaloneDisplay,
	shouldOfferInstallExperience
} from './pwa';

describe('pwa utils', () => {
	it('reports non-standalone in jsdom', () => {
		expect(isStandaloneDisplay()).toBe(false);
	});

	it('detects iOS user agent', () => {
		const ua = navigator.userAgent;
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
			configurable: true
		});
		expect(isIosDevice()).toBe(true);
		expect(isAndroidDevice()).toBe(false);
		Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
	});

	it('detects Android user agent', () => {
		const ua = navigator.userAgent;
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
			configurable: true
		});
		expect(isAndroidDevice()).toBe(true);
		Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
	});

	it('offers install when mobile and not standalone', () => {
		const ua = navigator.userAgent;
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (Linux; Android 14)',
			configurable: true
		});
		expect(shouldOfferInstallExperience()).toBe(true);
		Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
	});

	it('starts without deferred install prompt', () => {
		expect(canTriggerInstallPrompt()).toBe(false);
	});

	it('exports stable banner storage key', () => {
		expect(INSTALL_BANNER_DISMISSED_KEY).toBe('home-pantry-install-banner-dismissed');
	});
});
