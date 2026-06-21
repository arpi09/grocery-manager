import { afterEach, describe, expect, it, vi } from 'vitest';
import { capacitorTelemetrySource, isCapacitorNative } from './capacitor';

describe('capacitor utils', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns false outside browser', () => {
		vi.stubGlobal('window', undefined);
		expect(isCapacitorNative()).toBe(false);
		expect(capacitorTelemetrySource()).toBeNull();
	});

	it('returns false in plain browser', () => {
		vi.stubGlobal('window', {});
		expect(isCapacitorNative()).toBe(false);
	});

	it('detects native iOS WebView', () => {
		vi.stubGlobal('window', {
			Capacitor: {
				isNativePlatform: () => true,
				getPlatform: () => 'ios'
			}
		});
		expect(isCapacitorNative()).toBe(true);
		expect(capacitorTelemetrySource()).toBe('capacitor_ios');
	});

	it('detects native Android WebView', () => {
		vi.stubGlobal('window', {
			Capacitor: {
				isNativePlatform: () => true,
				getPlatform: () => 'android'
			}
		});
		expect(capacitorTelemetrySource()).toBe('capacitor_android');
	});
});
