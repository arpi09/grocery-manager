import { eq } from 'drizzle-orm';
import type { HouseholdBillingState } from '$lib/domain/billing';
import type { PlanTier } from '$lib/domain/plan';
import { db, type AppDatabase } from '$lib/infrastructure/db';
import { householdTable } from '$lib/infrastructure/db/schema';

export interface IBillingRepository {
	getBillingState(householdId: string): Promise<HouseholdBillingState | null>;
	updateStripeCustomerId(householdId: string, stripeCustomerId: string): Promise<void>;
	updateSubscription(input: {
		householdId: string;
		planTier: PlanTier;
		stripeSubscriptionId: string | null;
		stripeSubscriptionStatus: string | null;
	}): Promise<void>;
}

export class DrizzleBillingRepository implements IBillingRepository {
	constructor(private readonly database: AppDatabase = db) {}

	async getBillingState(householdId: string): Promise<HouseholdBillingState | null> {
		const rows = await this.database
			.select({
				planTier: householdTable.planTier,
				stripeCustomerId: householdTable.stripeCustomerId,
				stripeSubscriptionId: householdTable.stripeSubscriptionId,
				stripeSubscriptionStatus: householdTable.stripeSubscriptionStatus
			})
			.from(householdTable)
			.where(eq(householdTable.id, householdId))
			.limit(1);

		const row = rows[0];
		if (!row) {
			return null;
		}

		return {
			planTier: row.planTier,
			stripeCustomerId: row.stripeCustomerId,
			stripeSubscriptionId: row.stripeSubscriptionId,
			stripeSubscriptionStatus: row.stripeSubscriptionStatus
		};
	}

	async updateStripeCustomerId(householdId: string, stripeCustomerId: string): Promise<void> {
		await this.database
			.update(householdTable)
			.set({ stripeCustomerId })
			.where(eq(householdTable.id, householdId));
	}

	async updateSubscription(input: {
		householdId: string;
		planTier: PlanTier;
		stripeSubscriptionId: string | null;
		stripeSubscriptionStatus: string | null;
	}): Promise<void> {
		await this.database
			.update(householdTable)
			.set({
				planTier: input.planTier,
				stripeSubscriptionId: input.stripeSubscriptionId,
				stripeSubscriptionStatus: input.stripeSubscriptionStatus
			})
			.where(eq(householdTable.id, input.householdId));
	}
}
