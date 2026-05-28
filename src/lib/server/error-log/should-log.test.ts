import { error } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { shouldPersistServerError } from './should-log';

describe('shouldPersistServerError', () => {
	it('skips client http errors', () => {
		try {
			error(404, 'Not found');
		} catch (err) {
			expect(shouldPersistServerError(err, 404)).toBe(false);
		}
	});

	it('persists server errors', () => {
		try {
			error(500, 'Boom');
		} catch (err) {
			expect(shouldPersistServerError(err, 500)).toBe(true);
		}
		expect(shouldPersistServerError(new Error('fail'), 500)).toBe(true);
	});
});
