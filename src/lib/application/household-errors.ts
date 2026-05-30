import { fail } from '@sveltejs/kit';
import {
	AlreadyMemberError,
	DeleteHouseholdConfirmationError,
	HouseholdForbiddenError,
	HouseholdNotFoundError,
	InviteEmailMismatchError,
	InviteExpiredError,
	InviteNotFoundError,
	InviteNotPendingError,
	LastOwnerError,
	MemberNotFoundError,
	PendingInviteExistsError
} from '$lib/application/household.service';

export type HouseholdFormErrorField = 'householdError' | 'acceptError';

function failWithField(
	status: number,
	field: HouseholdFormErrorField,
	message: string
) {
	if (field === 'acceptError') {
		return fail(status, { acceptError: message });
	}
	return fail(status, { householdError: message });
}

/** Maps household domain errors to SvelteKit `fail()` for form actions. */
export function mapHouseholdErrorToFail(
	error: unknown,
	field: HouseholdFormErrorField = 'householdError'
) {
	if (error instanceof HouseholdForbiddenError) {
		return failWithField(403, field, error.message);
	}
	if (error instanceof InviteNotFoundError) {
		return failWithField(404, field, error.message);
	}
	if (error instanceof MemberNotFoundError || error instanceof HouseholdNotFoundError) {
		return failWithField(404, field, error.message);
	}
	if (error instanceof DeleteHouseholdConfirmationError) {
		return failWithField(400, field, error.message);
	}
	if (
		error instanceof AlreadyMemberError ||
		error instanceof PendingInviteExistsError ||
		error instanceof LastOwnerError ||
		error instanceof InviteNotPendingError ||
		error instanceof InviteExpiredError ||
		error instanceof InviteEmailMismatchError
	) {
		return failWithField(400, field, error.message);
	}
	throw error;
}
