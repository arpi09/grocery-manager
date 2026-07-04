import starterPack from '$lib/data/starter-pack.json';
import type { StorageLocation } from '$lib/domain/location';

export interface StarterPackItem {
	name: string;
	location: StorageLocation;
	category: 'kyl' | 'frys' | 'skafferi';
}

/** Kurerat onboarding-urval (~18 av 45) — de vanligaste basvarorna per zon. */
const ONBOARDING_STAPLE_NAMES = [
	'Mjölk',
	'Smör',
	'Ägg',
	'Ost',
	'Yoghurt',
	'Morötter',
	'Gurka',
	'Tomat',
	'Frysta grönsaker',
	'Fryst kyckling',
	'Bär',
	'Pasta',
	'Ris',
	'Havregryn',
	'Krossade tomater',
	'Olivolja',
	'Kaffe',
	'Vetemjöl'
] as const;

/** Förvalda vid start (~12) — resten är ett tap bort. */
const PRESELECTED_STAPLE_NAMES = new Set([
	'Mjölk',
	'Smör',
	'Ägg',
	'Ost',
	'Morötter',
	'Tomat',
	'Frysta grönsaker',
	'Pasta',
	'Ris',
	'Havregryn',
	'Krossade tomater',
	'Kaffe'
]);

export function getOnboardingStaples(): StarterPackItem[] {
	const byName = new Map(
		(starterPack as StarterPackItem[]).map((item) => [item.name, item] as const)
	);
	return ONBOARDING_STAPLE_NAMES.map((name) => byName.get(name)).filter(
		(item): item is StarterPackItem => Boolean(item)
	);
}

export function isStaplePreselected(name: string): boolean {
	return PRESELECTED_STAPLE_NAMES.has(name);
}

/**
 * Bygger FormData för /scan?/bulkCreate enligt bulkCreateFromForm-kontraktet:
 * selected=index-lista + name_i/location_i, bulkFlow=starter (inga köprader).
 */
export function buildStarterPackFormData(
	items: readonly StarterPackItem[],
	returnTo: string
): FormData {
	const formData = new FormData();
	formData.set('bulkFlow', 'starter');
	formData.set('returnTo', returnTo);
	items.forEach((item, index) => {
		formData.append('selected', String(index));
		formData.set(`name_${index}`, item.name);
		formData.set(`location_${index}`, item.location);
	});
	return formData;
}
