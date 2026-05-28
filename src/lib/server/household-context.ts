import type { HouseholdService } from '$lib/application/household.service';

export async function resolveHouseholdId(
	householdService: HouseholdService,
	userId: string
): Promise<string> {
	return householdService.ensureHouseholdForUser(userId);
}
