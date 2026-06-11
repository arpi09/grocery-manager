import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	getNotificationPermission,
	isNotificationApiAvailable,
	pushErrorMessage
} from './push-notifications';

describe('isNotificationApiAvailable', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns false when Notification is missing (e.g. iOS in-app webview)', () => {
		vi.stubGlobal('window', {});
		expect(isNotificationApiAvailable()).toBe(false);
		expect(getNotificationPermission()).toBeNull();
	});

	it('returns permission when Notification exists', () => {
		vi.stubGlobal('window', {
			Notification: { permission: 'default' as NotificationPermission }
		});
		expect(isNotificationApiAvailable()).toBe(true);
		expect(getNotificationPermission()).toBe('default');
	});
});

describe('pushErrorMessage', () => {
	it('maps service worker unavailable to localized copy', () => {
		const message = pushErrorMessage('service_worker_unavailable');
		expect(message.length).toBeGreaterThan(10);
	});

	it('maps not configured', () => {
		const message = pushErrorMessage('not_configured');
		expect(message).toMatch(/push|Push|notis|notification/i);
	});
});

