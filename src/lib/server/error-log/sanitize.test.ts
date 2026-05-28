import { describe, expect, it } from 'vitest';
import {
	errorMessageFromUnknown,
	sanitizeErrorText,
	truncateForLog
} from './sanitize';

describe('sanitizeErrorText', () => {
	it('redacts password and bearer tokens', () => {
		const input =
			'Login failed password=secret123 Bearer abc.def and lucia_session=deadbeef';
		const result = sanitizeErrorText(input);
		expect(result).not.toContain('secret123');
		expect(result).not.toContain('abc.def');
		expect(result).not.toContain('deadbeef');
		expect(result).toContain('[REDACTED]');
	});

	it('redacts JSON secret fields', () => {
		const input = '{"token":"my-token","message":"ok"}';
		const result = sanitizeErrorText(input);
		expect(result).not.toContain('my-token');
		expect(result).toContain('"token":"[REDACTED]"');
	});
});

describe('errorMessageFromUnknown', () => {
	it('sanitizes Error messages', () => {
		const err = new Error('Auth failed password=hunter2');
		expect(errorMessageFromUnknown(err)).not.toContain('hunter2');
	});
});

describe('truncateForLog', () => {
	it('truncates long strings', () => {
		const result = truncateForLog('a'.repeat(20), 10);
		expect(result.startsWith('a'.repeat(10))).toBe(true);
		expect(result).toContain('[truncated]');
	});
});
