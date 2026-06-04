import { describe, expect, it } from 'vitest';
import { pushErrorMessage } from './push-notifications';

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

