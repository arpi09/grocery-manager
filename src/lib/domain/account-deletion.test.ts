import { describe, expect, it } from 'vitest';
import { isAccountDeleteConfirmationValid } from './account-deletion';

describe('isAccountDeleteConfirmationValid', () => {
	it('accepts RADERA', () => {
		expect(isAccountDeleteConfirmationValid('RADERA')).toBe(true);
	});

	it('accepts DELETE', () => {
		expect(isAccountDeleteConfirmationValid('DELETE')).toBe(true);
	});

	it('accepts TA BORT', () => {
		expect(isAccountDeleteConfirmationValid('TA BORT')).toBe(true);
	});

	it('rejects mismatch', () => {
		expect(isAccountDeleteConfirmationValid('fel')).toBe(false);
	});
});
