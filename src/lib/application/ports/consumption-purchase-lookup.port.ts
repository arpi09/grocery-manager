export interface ConsumptionPurchaseLookupPort {
	findLatestPurchasedAt(
		householdId: string,
		normalizedKey: string,
		notAfter: Date
	): Promise<string | null>;
}
