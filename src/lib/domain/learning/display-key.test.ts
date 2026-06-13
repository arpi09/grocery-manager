import { describe, expect, it } from 'vitest';
import { formatNormalizedKeyForDisplay } from '$lib/domain/learning/display-key';

describe('formatNormalizedKeyForDisplay', () => {
	it('title-cases normalized receipt keys', () => {
		expect(formatNormalizedKeyForDisplay('mjolk 3')).toBe('Mjolk 3');
		expect(formatNormalizedKeyForDisplay('  brod  ')).toBe('Brod');
	});
});
