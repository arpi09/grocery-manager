import type { HouseholdView } from '$lib/domain/household';
import { generateId } from '$lib/infrastructure/auth/id';
import type { IHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';

export class HouseholdService {
	constructor(private readonly repository: IHouseholdRepository) {}

	async getHouseholdForUser(userId: string): Promise<HouseholdView | null> {
		return this.repository.getHouseholdForUser(userId);
	}

	async ensureHouseholdForUser(userId: string): Promise<string> {
		const existing = await this.repository.findPrimaryHouseholdIdForUser(userId);
		if (existing) {
			return existing;
		}

		const householdId = generateId();
		await this.repository.createHousehold(householdId, 'Mitt hushåll');
		await this.repository.addMember(householdId, userId, 'owner');
		return householdId;
	}
}
