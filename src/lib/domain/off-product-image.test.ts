import { describe, it, expect } from 'vitest';
import { resolveOffImageUrl } from './off-product-image';

describe('resolveOffImageUrl', () => {
	it('prefers image_front_small_url over image_front_url', () => {
		expect(
			resolveOffImageUrl({
				image_front_small_url: 'https://example.com/small.jpg',
				image_front_url: 'https://example.com/full.jpg'
			})
		).toBe('https://example.com/small.jpg');
	});

	it('falls back to image_front_url when small is missing', () => {
		expect(
			resolveOffImageUrl({
				image_front_url: 'https://example.com/full.jpg'
			})
		).toBe('https://example.com/full.jpg');
	});

	it('returns null when no image fields exist', () => {
		expect(resolveOffImageUrl({})).toBeNull();
	});
});
