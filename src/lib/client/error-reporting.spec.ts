import { describe, it, expect } from 'vitest';
import { isChunkLoadError } from './error-reporting';

describe('isChunkLoadError', () => {
	it('matches JS dynamic-import failures (stale chunk after deploy)', () => {
		expect(
			isChunkLoadError('Failed to fetch dynamically imported module: https://skaffu.com/_app/immutable/chunks/x.js')
		).toBe(true);
		expect(isChunkLoadError('Importing a module script failed.')).toBe(true);
	});

	it('matches SvelteKit CSS preload failures (stale assets after deploy)', () => {
		// Real prod message — a stale tab requesting a CSS asset whose hash changed.
		expect(
			isChunkLoadError(
				'Unable to preload CSS for https://skaffu.com/_app/immutable/assets/Card.CejJCf3d.css'
			)
		).toBe(true);
	});

	it('ignores unrelated runtime errors', () => {
		expect(isChunkLoadError('TypeError: x is not a function')).toBe(false);
		expect(isChunkLoadError('Load failed')).toBe(false);
	});
});
