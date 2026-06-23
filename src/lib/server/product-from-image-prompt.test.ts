import { describe, expect, it } from 'vitest';
import {
	buildProductFromImageUserPrompt,
	parseProductFromImageLocationHint
} from '$lib/server/product-from-image-prompt';

describe('product-from-image prompt', () => {
	it('parses storage location hints', () => {
		expect(parseProductFromImageLocationHint('fridge')).toBe('fridge');
		expect(parseProductFromImageLocationHint('invalid')).toBeNull();
	});

	it('embeds location hint in user JSON payload', () => {
		const payload = JSON.parse(buildProductFromImageUserPrompt('en', 'freezer'));
		expect(payload.locationHint).toBe('freezer');
		expect(payload.storageHint).toBe('frys');
	});
});
