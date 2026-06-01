import {
	isLandingHeroVariant,
	type LandingHeroVariant
} from '$lib/marketing/landing-variants';

const SESSION_KEY = 'hp_landing_variant';

export function readLandingVariantSession(): LandingHeroVariant | null {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}
	const value = sessionStorage.getItem(SESSION_KEY);
	return isLandingHeroVariant(value) ? value : null;
}

export function writeLandingVariantSession(variant: LandingHeroVariant): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.setItem(SESSION_KEY, variant);
}

export function clearLandingVariantSession(): void {
	if (typeof sessionStorage === 'undefined') {
		return;
	}
	sessionStorage.removeItem(SESSION_KEY);
}
