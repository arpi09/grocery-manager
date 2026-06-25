import type { ReceiptPurchaseLineRecord } from '$lib/domain/purchase-pattern';
import {
	deriveHouseholdShoppingCadence,
	formatCadenceWeekday,
	type HouseholdShoppingCadence
} from '$lib/domain/household-shopping-cadence';

export type { HouseholdShoppingCadence };

export function buildHouseholdCadence(
	lines: ReceiptPurchaseLineRecord[]
): HouseholdShoppingCadence | null {
	return deriveHouseholdShoppingCadence(lines);
}

export function formatHouseholdCadenceOneLiner(
	cadence: HouseholdShoppingCadence,
	locale: 'sv' | 'en'
): string {
	const weekday = formatCadenceWeekday(cadence.weekday, locale);
	if (cadence.storeLabel) {
		return locale === 'en'
			? `You usually shop on ${weekday} at ${cadence.storeLabel}.`
			: `Ni brukar handla på ${weekday} hos ${cadence.storeLabel}.`;
	}
	return locale === 'en'
		? `You usually shop on ${weekday}.`
		: `Ni brukar handla på ${weekday}.`;
}
