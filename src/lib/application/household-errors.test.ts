import { describe, expect, it } from 'vitest';
import {
	AlreadyMemberError,
	DeleteHouseholdConfirmationError,
	HouseholdForbiddenError,
	HouseholdNotFoundError,
	InviteNotFoundError,
	LastOwnerError
} from '$lib/application/household.service';
import { mapHouseholdErrorToFail } from './household-errors';

describe('mapHouseholdErrorToFail', () => {
	it('maps forbidden errors to 403 with householdError field', () => {
		const result = mapHouseholdErrorToFail(new HouseholdForbiddenError());
		expect(result.status).toBe(403);
		expect(result.data).toEqual({ householdError: 'Endast ägare kan utföra denna åtgärd.' });
	});

	it('maps invite not found to 404 with acceptError field', () => {
		const result = mapHouseholdErrorToFail(new InviteNotFoundError(), 'acceptError');
		expect(result.status).toBe(404);
		expect(result.data).toEqual({ acceptError: 'Inbjudan hittades inte.' });
	});

	it('maps membership conflicts to 400', () => {
		const result = mapHouseholdErrorToFail(new AlreadyMemberError());
		expect(result.status).toBe(400);
		expect(result.data).toEqual({ householdError: 'Användaren är redan medlem i hushållet.' });
	});

	it('maps last owner constraint to 400', () => {
		const result = mapHouseholdErrorToFail(new LastOwnerError());
		expect(result.status).toBe(400);
	});

	it('maps delete confirmation mismatch to 400', () => {
		const result = mapHouseholdErrorToFail(new DeleteHouseholdConfirmationError());
		expect(result.status).toBe(400);
	});

	it('maps missing household to 404', () => {
		const result = mapHouseholdErrorToFail(new HouseholdNotFoundError());
		expect(result.status).toBe(404);
	});

	it('rethrows unknown errors', () => {
		expect(() => mapHouseholdErrorToFail(new Error('boom'))).toThrow('boom');
	});
});
