import type { StorageLocation } from '$lib/domain/location';
import type { IHouseholdLocationRuleRepository } from '$lib/infrastructure/repositories/household-location-rule.repository';
import type { IHouseholdShelfLifeRuleRepository } from '$lib/infrastructure/repositories/household-shelf-life-rule.repository';
import type { IPurchasePatternRepository } from '$lib/infrastructure/repositories/purchase-pattern.repository';

export interface HouseholdMemoryAlias {
	normalizedKey: string;
	displayName: string;
	location: StorageLocation;
	typicalDays: number;
	sampleCount: number;
}

export interface LoadReceiptHouseholdMemoryOptions {
	shelfLifeRules?: IHouseholdShelfLifeRuleRepository;
	locationRules?: IHouseholdLocationRuleRepository;
	limit?: number;
}

export async function loadReceiptHouseholdMemoryAliases(
	repository: IPurchasePatternRepository,
	householdId: string,
	options: LoadReceiptHouseholdMemoryOptions = {}
): Promise<HouseholdMemoryAlias[]> {
	const limit = options.limit ?? 20;
	const aliases = await repository.listTopPurchaseAliases(householdId, limit);

	return Promise.all(
		aliases.map(async (alias) => {
			const learned = options.shelfLifeRules
				? await options.shelfLifeRules.findByKey(
						householdId,
						alias.normalizedKey,
						alias.location
					)
				: null;

			return {
				normalizedKey: alias.normalizedKey,
				displayName: alias.displayName,
				location: alias.location,
				typicalDays: learned?.typicalDays ?? 7,
				sampleCount: learned?.sampleCount ?? alias.purchaseCount
			};
		})
	);
}

export function buildReceiptHouseholdMemoryBlock(aliases: HouseholdMemoryAlias[]): string {
	if (aliases.length === 0) return '';
	const rows = aliases.map(
		(alias) =>
			`- ${alias.displayName} (${alias.location}): ~${alias.typicalDays} d, köpt ${alias.sampleCount} ggr`
	);
	return ['Hushållsminne (toppköpta alias):', ...rows].join('\n');
}

export async function buildReceiptLocationRulesBlock(
	locationRules: IHouseholdLocationRuleRepository | undefined,
	householdId: string,
	limit = 15
): Promise<string> {
	if (!locationRules) return '';

	const rules = await locationRules.listByHousehold(householdId, 2);
	if (rules.length === 0) return '';

	const rows = rules.slice(0, limit).map(
		(rule) => `- ${rule.normalizedKey} → ${rule.location} (${rule.sampleCount} ggr)`
	);
	return ['Inlärda förvaringsplatser:', ...rows].join('\n');
}

export async function buildReceiptHouseholdMemorySection(
	repository: IPurchasePatternRepository,
	householdId: string,
	options: LoadReceiptHouseholdMemoryOptions = {}
): Promise<string> {
	const [aliases, locationBlock] = await Promise.all([
		loadReceiptHouseholdMemoryAliases(repository, householdId, options),
		buildReceiptLocationRulesBlock(options.locationRules, householdId)
	]);

	const aliasBlock = buildReceiptHouseholdMemoryBlock(aliases);
	return [aliasBlock, locationBlock].filter(Boolean).join('\n\n');
}
