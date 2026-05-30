import type { MarketingLocale } from '$lib/marketing/content';

export type LandingHeroVariant = 'a' | 'b';

export const LANDING_VARIANT_COOKIE = 'landing_variant';

export interface LandingHeroCopy {
	heroTitle: string;
	heroLead: string;
	heroSecondary: string;
}

const heroByVariant: Record<MarketingLocale, Record<LandingHeroVariant, LandingHeroCopy>> = {
	sv: {
		a: {
			heroTitle: 'Skanna först. Slipp gissa vad som finns hemma.',
			heroLead:
				'Home Pantry är byggt kring snabb registrering — streckkod, kvitto eller foto — så du alltid vet vad som finns i kyl, frys och skafferi.',
			heroSecondary:
				'Planera måltider, få varningar innan varor går ut och låt inköpslistan fylla på sig utifrån det du faktiskt har.'
		},
		b: {
			heroTitle: 'Butiksneutralt skafferi för hela hushållet.',
			heroLead:
				'Oavsett om du handlar på ICA, Willys, Coop eller Lidl — ett gemensamt lager, utgångsdatum och inköpslista som speglar vad som faktiskt finns hemma.',
			heroSecondary:
				'Webb först: skanna streckkod, foto eller PDF-kvitto från Kivra utan att byta matkedja eller stammiskonto.'
		}
	},
	en: {
		a: {
			heroTitle: 'Scan first. Stop guessing what is at home.',
			heroLead:
				'Home Pantry is built around fast capture — barcode, receipt or photo — so you always know what is in fridge, freezer and cupboard.',
			heroSecondary:
				'Plan meals, get warnings before items expire, and let the shopping list fill from what you actually have.'
		},
		b: {
			heroTitle: 'Store-neutral pantry for the whole household.',
			heroLead:
				'Whether you shop at ICA, Willys, Coop or Lidl — one shared inventory, expiry dates and shopping list based on what is actually at home.',
			heroSecondary:
				'Web-first: scan barcodes, photos or PDF receipts from Kivra without switching retailer or loyalty accounts.'
		}
	}
};

export function isLandingHeroVariant(value: string | null | undefined): value is LandingHeroVariant {
	return value === 'a' || value === 'b';
}

/** Query `?hero=` wins, then cookie, then `PUBLIC_LANDING_VARIANT`, default `a`. */
export function resolveLandingVariant(input: {
	queryHero?: string | null;
	cookieVariant?: string | null;
	envVariant?: string | null;
}): LandingHeroVariant {
	const fromQuery = input.queryHero?.trim().toLowerCase();
	if (isLandingHeroVariant(fromQuery)) {
		return fromQuery;
	}
	if (isLandingHeroVariant(input.cookieVariant)) {
		return input.cookieVariant;
	}
	const fromEnv = input.envVariant?.trim().toLowerCase();
	if (isLandingHeroVariant(fromEnv)) {
		return fromEnv;
	}
	return 'a';
}

export function getLandingHeroCopy(
	variant: LandingHeroVariant,
	locale: MarketingLocale = 'sv'
): LandingHeroCopy {
	return heroByVariant[locale][variant];
}
